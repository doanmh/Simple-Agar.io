var gulp = require('gulp');
var babel = require('gulp-babel');
var nodemon = require('gulp-nodemon');
var uglify = require('gulp-uglify');
var webpack = require('webpack-stream');
var del = require('del');

gulp.task('build', ['clean', 'build-config', 'build-lib', 'build-models', 'build-client', 'build-server']);

gulp.task('clean', function() {
    return del.sync('./bin');
});

gulp.task('build-client', ['move-client'], function() {
    return gulp.src(["src/client/js/app.js"])
        .pipe(uglify())
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(babel({
            presets: [
                ['es2015', {'modules': false }]
            ]
        }))
        .pipe(gulp.dest('bin/client/js'));
});

gulp.task('move-client', function() {
    return gulp.src(['src/client/**/*.*', "!client/js/*.js"])
        .pipe(gulp.dest("./bin/client/"));
});

gulp.task('build-server', function() {
    return gulp.src(['src/server/**/*.*', 'src/server/**/*.js'])
        .pipe(gulp.dest("./bin/server"));
});

gulp.task('build-config', function() {
    return gulp.src(['src/config/**/*.*', 'src/config/**/*.js'])
        .pipe(gulp.dest("./bin/config"));
});

gulp.task('build-models', function() {
    return gulp.src(['src/models/**/*.*', 'src/models/**/*.js'])
        .pipe(gulp.dest("./bin/models"));
})

gulp.task('build-lib', function() {
    return gulp.src(['src/lib/**/*.*', 'src/lib/**/*.js'])
        .pipe(gulp.dest("./bin/lib"));
})

gulp.task('watch', ['build'], function() {
    gulp.watch(['src/client/**/*.*'], ['build-client', 'move-client']);
    gulp.watch(['src/server/*.*', 'src/server/*.js'], ['build-server']);
    gulp.watch(['src/config/**/*.*', 'src/config/**/*.js', 'src/config/**/*.json'], ['build-config']);
    gulp.watch(['src/models/**/*.*', 'src/models/**/*.js'], ['build-models']);
    gulp.watch(['src/lib/**/*.*', 'src/lib/**/*.js'], ['build-lib']);
});

gulp.task('run', ['build'], function() {
    nodemon({
        delay: 10,
        script: './server/server.js',
        cwd: "./bin",
        ext: 'html js css'
    });
});

gulp.task('default', ['run']);