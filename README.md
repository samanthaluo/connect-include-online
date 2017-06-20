connect-include-online
===========

作为[connect]或者[gulp-connect]的插件使用,先查找本地文件，再查找服务器上的文件，可配置文件或目录对应的服务器域名，默认配置文件为根目录下config.json,也可手动设置配置文件。


## Install

    npm install --save-dev connect-include-online

## Examples

### .html文件中

支持以下形式的include:

    <!--#include file="path" -->
    <!--#include virtual="path" -->


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


## 获取服务器上的页面片

如需获取服务器上的页面片, 则需要配置页面片所在的服务器域名。有3中配置域名的方式：

### 1、options中配置domain

    gulp.task('connect', connect.server({
        root: ['app'],
        middleware: function() {
            return [connectIncludeOnline({
	    		baseDir: '.',
	            exts:'html',
	            encoding:'gbk',
	            domain:'www.qq.com'   //为整个项目配置页面片域名，优先级低于config.json
	    	})];
        }
    }));


### 2、config.json

添加配置文件,默认根目录下config.json，常用于为某些特定目录或文件配置特定的域名。

    {
      "online":[
        {"path":".","domain":"http://news.qq.com"}，
        {"path":"./test.html","domain":"sports.qq.com"}
      ]
    }


ps:如果当前是页面是test.html，config中则优先'./test.html',所以取的domain是"sports.qq.com"

### 3、手动设置配置文件
如果不想使用默认的config.json，可手动设置配置文件。

    gulp.task('connect', connect.server({
        root: ['app'],
        middleware: function() {
            return [connectIncludeOnline({
                baseDir: '.',
                exts:'html',
                encoding:'gbk',
                config: './test/config.json'
            })];
        }
    }));


## Configuration

    {
        exts: 'html|htm|shtm', //文件扩展名，对request的文件过滤
        baseDir: __dirname, // base path to look in for files
        encoding:'gbk', //当include的线上文件是gbk编码，需转换为"utf-8"时
        domain:'www.qq.com',   //为整个项目配置页面片域名，优先级低于config.json
        config:'./test/config.json' //配置文件路径
    }

[Connect]: http://senchalabs.github.com/connect
[gulp-connect]: https://github.com/avevlad/gulp-connect

