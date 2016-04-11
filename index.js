'use stric'
var gulp = require('gulp');
var defaults = require('defaults');
var fs = require('fs');
var async = require('async');
var request = require('request');
var progress = require('request-progress');
var path = require('path');
var parseurl = require('parseurl');
var iconv = require('iconv-lite');


module.exports = function connectIncludeOnline(opt){
	opt = defaults(opt, {
    	baseDir: '.',
    	ext: '.html',
    	encoding:''
  	});
  	function endsWith(str, suffix) {
	    return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
  	return function(req,res,next){
  		var url = parseurl(req).pathname;
		if(!endsWith(url, opt.ext)) {
	    	return next();
	    }
		fs.readFile(filePath,{},function(err,content){
			if(err){ //读取当前文件出错，继续下一个文件
				console.log('error'+count);
				return next();
			}
			async.whilst(
				function test() {return !!(matches = includeFileReg.exec(content)); },
				function insertInclude(innerNext){
					var domain = matches[2];
					var shortPath = matches[5];
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
						innerNext(null, content);
					}),{throttle:1000,delay:1000});
				},
				function includesComplete(err){
					if(err){
						return next();
					}
					res.end(content);
				}
			);
			
		});
  	}
}


