'use stric'

var path = require('path');
var fs = require('fs');
var request = require('request');
var progress = require('request-progress');
var parseurl = require('parseurl');
var async = require('async');
var iconv = require('iconv-lite');
var defaults = require('defaults');

var includeFileReg=/<!--#\s*include\s+(file|virtual)=(['"])([^\r\n]+?)\2(\s+domain=(['"])([^\r\n]+?)\5)?\s*-->/g;
function resolveIncludes(content, opt, callback){
	content = content.toString();
		async.whilst(
			function test() {
				includeFileReg.lastIndex =0;
				return !!(matches = includeFileReg.exec(content));
			},
			function insertInclude(innerNext){

				var shortPath = matches[3];
				var domain = matches[6];
				if(!domain){
					var tpath =  path.join(opt.baseDir, shortPath);
					fs.readFile(tpath, {}, function(err, innerContentRaw) {
                        if (err) {
                            return innerNext(err);
                        }
						content = content.slice(0,matches.index)+innerContentRaw+content.slice(matches.index + matches[0].length);
                        innerNext(null, content);
                      		
                        }
                    );
				}else{
					var httpReg=/(http|ftp|https):\/\//g;
					httpReg.lastIndex=0;
					if(!httpReg.test(domain)){
						domain="http://"+domain
					}
					var src=domain+shortPath;
					progress(request({url:src,encoding:null},function(err,innerRes,innerContent){
						if(err){
							return innerNext(err);	
						}
	
						if(opt.encoding.toLowerCase()=='gbk'){
							innerContent= iconv.decode(innerContent, 'GBK');//return unicode string from GBK encoded bytes
						}
						var first = matches.index;
						var second=matches.index + matches[0].length;
						content = content.slice(0,first)+innerContent+content.slice(second);
						innerNext(null, content);
					}),{throttle:1000,delay:1000});
				}
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
				return next();
			}
			resolveIncludes(content, opt, function(err, content){
				if(err){
					return next(err);
				}
				res.end(content);
			})
		});
  	}
}
