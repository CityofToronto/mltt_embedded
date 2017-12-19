const gulp = require('gulp');
const core = require('./bower_components/core/gulp_helper');
const pkg = require('./package.json');

let options = {
  pkg, //pass in the contents of package.json

  embedArea: 'full'
};

core.embeddedApp.createTasks(gulp, options);

return gulp.src(['src/data/*']).pipe(gulp.dest('dist/app_content' ));

