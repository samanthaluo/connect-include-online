var gulp = require('gulp');
var connect=require('gulp-connect'); //本地服务

//本地server
gulp.task('connect',function(){
	connect.server({
	    root: 'test',
	    port:80,
	    livereload: true,
	    middleware: function() {
	    	/*
	    	return [connectIncludeOnline({
	    		baseDir: 'src',
	            exts:'html|htm|shtm',
	            encoding:'gbk'
	    	})];
	    	*/
	    	return [connectIncludeOnline({
	    		baseDir:'test',
	            exts:'html|htm',
	            encoding:'gbk'
	    	})];
	    }
	  })
});



var path = require('path');
var fs = require('fs');
var request = require('request');
var progress = require('request-progress');
var parseurl = require('parseurl');
var async = require('async');
var iconv = require('iconv-lite');
var defaults = require('defaults');

var includeFileReg=/<!--#\s*include\s+(file|virtual)=(['"])([^\r\n]+?)\2\s*-->/g;
var httpReg=/(http|ftp|https):\/\//g;
function resolveIncludes(content, opt,callback){
	content = content.toString();
		async.whilst(
			function test() {
				includeFileReg.lastIndex =0;
				return !!(matches = includeFileReg.exec(content));
			},
			function insertInclude(innerNext){
				var shortPath = matches[3];
				var tpath =  path.join(opt.baseDir, shortPath);
				fs.readFile(tpath, {}, function(err, innerContentRaw) {
						if (err) { //读取本地文件出错
							var domain = opt.domain;
							if(opt.domain){


								httpReg.lastIndex=0;
								if(!httpReg.test(domain)){
									domain="http://"+domain
								}
								var src=domain+shortPath;
								progress(request({url:src,encoding:null},function(err1,innerRes,innerContent){
									if(err1){
										return innerNext(err+' and '+err1);
									}

									if(opt.encoding.toLowerCase()=='gbk'){
										innerContent= iconv.decode(innerContent, 'GBK');//return unicode string from GBK encoded bytes
									}
									if(matches){
										var first = matches.index;
										var second=matches.index + matches[0].length;
										content = content.slice(0,first)+innerContent+content.slice(second);
									}

									innerNext(null, content);
								}),{throttle:1000,delay:1000});
							}

						}else{
							content = content.slice(0,matches.index)+innerContentRaw+content.slice(matches.index + matches[0].length);
							innerNext(null, content);
						}
					});
			},
			function includesComplete(err){
				if(err){
					return callback(err);
				}
				return callback(null, content);
			}
		);	
}

function endsWith(str, suffixs) {
    var extReg = new RegExp('[.]('+suffixs+')$','g');
	return extReg.test(str);
}

function connectIncludeOnline(opt){
	opt = defaults(opt, {
    	baseDir: '.',
    	exts: 'html',
    	encoding:''
  	});

  	return function(req,res,next){
  		var url = parseurl(req).pathname;
  		url = /\/$/.test(url) ? (url + 'index.html') : url;
		if(!endsWith(url, opt.exts)) {
	    	return next();
	    }
		
		var filePath = path.join(opt.baseDir, url);
		//文件读取
		fs.readFile(filePath,{},function(err,content){			
			if(err){ //读取当前文件出错，继续下一个文件
				return next(err);
			}
			var configFile = (opt.config? opt.config:'./config.json');
			configFile = path.resolve(process.cwd(), configFile);
			fs.access(configFile,function(err) {
				if (!err) {
					var ssi = require(configFile);
					var online = ssi.online;
					var whichPath = 0;
					var len = 0;
					online.forEach(function (item, i) {
						var basePath = path.join(opt.baseDir, item.path);
						if (filePath.indexOf(basePath) == 0) {
							if (basePath.length > len) {
								len = basePath.length;
								whichPath = i;
							}
						}
					});

					opt.domain = ssi.online[whichPath].domain;
				}

				resolveIncludes(content, opt,function(err, content){
					if(err){
						return next(err);
					}
					res.end(content);
				})
			});

		});
  	}
}