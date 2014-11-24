module.exports = function(grunt) {

    var _rs = 'public/src', rs = 'public/js', noJS = [];

    ['start', 'resolve', 'loader', 'define', 'config', 'use', 'exports', 'init', 'end'].forEach(function(i){
        noJS.push(_rs+'/lib/nojs/src/'+i+'.js');
    });
    var concatnoJS = {}, concatConf = {};
    concatnoJS[_rs+'/lib/nojs/noJS.js'] = noJS;
    concatnoJS[rs+'/lib/nojs/noJS.js'] = noJS;
    concatConf[rs+'/conf.js'] = _rs+'/conf.js';
   
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
        transport: {
            dialog: {
            	options : {
            		paths : [_rs],
                    alias: {
                        '$' : 'lib/jquery/jquery',
                        'ui' : 'lib/nojs/ui',
                        'ko' : 'lib/knockout/knockout-2.2.0'
                    }
		        },
                files : [
                    {	
                    	expand: true,
                    	cwd: _rs+'/',
                        src : '**/*.js',
                        dest : '.build',
                        //接受匹配到的文件名，和匹配的目标位置，返回一个新的目标路径
                        rename1 : function(a,b,c){
                            console.log(a,b,c);
                            return 'rename';
                        },
                        filter : function(file){
                            if( file.indexOf('\\lib\\nojs\\src')>=0 ){
                                return false;
                            }else{
                                return true;
                            }
                        }
                    }
                ]
            }
        },        
        concat: {            
            dist: {
            	options : {
            		paths : ['.build'],
            		include : 'relative'
		        },
		        files : [
		        	{
		        		expand: true,
		        		cwd: '.build/',
		        		src : '**/*.js',
		        		dest : rs
		        	}
		        ]
            },
            noJS : {
                options : {
                    noncmd : true
                },
                files : concatnoJS
            },
            conf : {
                options : {
                    noncmd : true
                },
                files : concatConf
            }
        },
        clean : {
			build : ['.build',rs+'/**/*-debug.js']
		},
        uglify : {
        	options: {
        		banner: '/*nolure@vip.qq.com*/',
        		mangle: {
                    except: ['require']
                }
		    },
        	main : {        	    
                files : [
                	{
	                	expand : true,
	                	cwd: rs+'/',
	                	src : "**/*.js",
	                	dest : rs
	                }
                ]
			}
        },      
        watch: {            
            css : {
                files: ['_css/**/*.css'],
                tasks: ['cssmin','concat:css'],
                options: {
                    livereload: 1334,
                }
            },
            noJS : {
                files: [_rs+'/lib/nojs/src/*.js'],
                tasks: ['concat:noJS'],
                options: {
                    livereload: 1335,
                }
            }
        }
	});
	
	grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-cmd-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    //all 'copy:js', transport之后
    grunt.registerTask('default',['transport','concat','clean','uglify']);
    
};