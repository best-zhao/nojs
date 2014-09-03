module.exports = function(grunt) {

    var noJS = [];
    ['start', 'resolve', 'loader', 'define', 'config', 'use', 'exports', 'init', 'end'].forEach(function(i){
        noJS.push('src/lib/src/'+i+'.js');
    });
   
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
        transport: {
            dialog: {
            	options : {
            		paths : ['src'],
                    alias: {
                        '$' : 'lib/jquery',
                        'ui' : 'lib/ui',
                        '$b' : 'pj/b'
                    }
		        },
                files : [
                    {	
                    	expand: true,
                    	cwd: 'src/',
                        src : '**/*.js',
                        dest : '.build',
                        filter : function(file){
                            if( file.indexOf('\\lib\\src')>=0 ){
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
		        		dest : 'js'
		        	}
		        ]
            },
            noJS : {
                options : {
                    noncmd : true
                },
                files : {
                    'src/lib/noJS.js' : noJS
                }
            }
        },
        clean : {
			build : ['.build','js/**/*-debug.js']
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
	                	cwd: 'js',
	                	src : "**/*.js",
	                	dest : 'js'
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
                files: ['src/lib/src/*.js'],
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
    grunt.registerTask('default',['transport','concat','clean']);
    
};