'use stric'

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
var reqArr=[];
var status=false;

function resolveIncludes(content, opt,callback){
	content = content.toString();
	includeFileReg.lastIndex =0;
	async.whilst(
		function test() {
			return !!(matches = includeFileReg.exec(content));
		},
		function insertInclude(innerNext){
			var shortPath = matches[3];
			var tpath =  path.join(opt.baseDir, shortPath);
			fs.readFile(tpath, {}, function(err, innerContentRaw) {
				if (err) { //读取本地文件出错
					var domain = opt.domain;
					if(opt.domain){
						var src=domain+shortPath;
						progress(request({url:src,encoding:null},function(err1,response,innerContent){
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

module.exports = function(opt){
	opt = defaults(opt, {
		baseDir: '.',
		exts: 'html',
		encoding:'',
		config:false,
		domain:''
	});
	return function(req,res,next){
		var url = parseurl(req).pathname;
		url = /\/$/.test(url) ? (url + 'index.html') : url;
		if(!endsWith(url, opt.exts)) {
			return next();
		}
		reqArr.push(url);
		if(status){return;}
		status = true;
		var finalUrl = reqArr.pop();
		if(!finalUrl){return;}
		reqArr.length=0;

		var domain =opt.domain;
		var filePath = path.join(opt.baseDir, finalUrl)
		//文件读取
		fs.readFile(filePath,{},function(err,content){
			if(err){ //读取当前文件出错，继续下一个文件
				return next(err);
			}
			var configFile = opt.config? opt.config:'./config.json';
			configFile = path.resolve(process.cwd(), configFile);
			if(fs.existsSync(configFile)){
				var ssi = require(configFile);
				var online = ssi.online;
				if(online && online.length>0){
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

			}
			httpReg.lastIndex =0;
			if (!httpReg.test(domain)) {
				opt.domain = "http://" + domain
			}
			resolveIncludes(content, opt,function(err, content){
				if(err){
					return next(err);
				}
				res.end(content);
				status = false;
			})
		});

	}

}
