var gulp = require('gulp');
var connect=require('gulp-connect'); //本地服务

//本地server
gulp.task('connect',function(){
	connect.server({
	    root: 'test',
	    port:80,
	    livereload: true,
	    middleware: function() {
	    	return [connectIncludeOnline({
	    		baseDir:'test',
	            exts:'html|htm',
	            encoding:'gbk',
				config:'./test'
	    	})];
	    }
	  })
});

