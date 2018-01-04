
var gulp= require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var cleanCSS = require('gulp-clean-css');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
var del = require('del');
var eslint = require('gulp-eslint');
var watch = require('gulp-watch');
var notify = require("gulp-notify");
var plumber = require('gulp-plumber');

//Init
var jsPath= 'public/js/**/*.js';
var jsDist= 'public/dist/js';
var cssPath= 'public/css/**/*.css';
var cssDist= 'public/dist/css';
var revManifest= 'public/rev/';
var viewsPath= 'app/web/**/*.ejs';
var viewsDist= 'app/build/web';
var watchDir= 'app/**';

//压缩js
gulp.task('compressJS', function(){
  return pump([
            gulp.src(jsPath),
            uglify(),
            rev(),
            gulp.dest(jsDist),
            rev.manifest(),
            gulp.dest(revManifest+'js')
          ],
          function (err) {
            if(err){
              console.log(err);
              return;
            }
          }
        );
});

//压缩css
gulp.task('compressCss', function(){
  return pump([
              gulp.src(cssPath),
              cleanCSS(),
              rev(),
              gulp.dest(cssDist),
              rev.manifest(),
              gulp.dest(revManifest+'css')
            ],
            function (err) {
              if(err){
                console.log(err);
                return;
              }
            }           
          );
});


//清空目录
gulp.task('cleanDir', function(){
  del(
    [jsDist, cssDist],             
    function(err){
      if(err){
        console.log(err);
        return;
      }   
  });
});

//替换引用
gulp.task('replaceRef', ['compressCss', 'compressJS'], function(){
    return pump([
                  gulp.src([revManifest+'/**/*.json', viewsPath]),
                  revCollector({
                    replaceReved: true,
                    dirReplacements: {
                      '/css/': '/dist/css/',
                      '/js/': '/dist/js/'
                    }
                  }),
                  gulp.dest(viewsDist)
                ],
                function (err) {
                  if(err){
                    console.log(err);
                    return;
                  }
                }   
              );
});

//监控
gulp.task('watch', function(){
  return watch([watchDir,'!node_modules/**'], { ignoreInitial: false }, function(){
    gulp.src(watchDir)
    .pipe(plumber())
    .pipe(eslint({'fix': false}))
    .pipe(eslint.formatEach())
    .pipe(eslint.failAfterError())
    .on("error", notify.onError(function (error) {
      return "Message to the notifier: " + error.message;
    })); 
  });
});

//ESLint: https://google.github.io/styleguide/javascriptguide.xml
gulp.task('lint', function(){
    return gulp.src(['**/*.js','!node_modules/**']) 
        .pipe(eslint())
        .pipe(eslint.format()) 
        .pipe(eslint.failAfterError());
});

//默认入口
gulp.task('default', ['compressJS', 'compressCss', 'replaceRef'], function(){
  console.log('Gulp done !');
});