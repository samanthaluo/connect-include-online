var gulp = require('gulp');
var connect=require('gulp-connect'); //本地服务
//本地server
gulp.task('dev:connect',function(){
	connect.server({
	    root: 'src',
	    port:80,
	    livereload: true,
	    middleware: function() {
	    	return [connectIncludeOnline({
	    		baseDir: 'src',
	            exts:'html|htm|shtm',
	            encoding:'gbk'
	    	})];   
	    }
	  })
});
