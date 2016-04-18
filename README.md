connect-include-online
===========

作为[connect]或者[gulp-connect]的插件使用

## Install

    npm install --save-dev connect-include-online

## Examples

### .html文件中

支持以下形式的include:


    <!--# include file="path" -->
    <!--# include virtual="path" -->

    <!--# include file="path" domain="domain" -->
    <!--# include virtual="path" domain="domain" -->

ps:"domain"例如"http://sports.qq.com" 或 "sports.qq.com"
   "path"例如"/a/b/c.html"

下一步，作为插件使用：

### Using [gulp-connect]

    gulp.task('connect', connect.server({
        root: ['app'],
        middleware: function() {
            return [connectIncludeOnline({
	    		baseDir: '.',
	            exts:'html',
	            encoding:'gbk'
	    	})];
        }
    }));


## Configuration

    {
        exts: 'html|htm|shtm', //文件扩展名，对request的文件过滤
        baseDir: __dirname, // base path to look in for files
        encoding:'gbk' //当include的线上文件是gbk编码，需转换为"utf-8"时
    }

[Connect]: http://senchalabs.github.com/connect
[gulp-connect]: https://github.com/avevlad/gulp-connect

