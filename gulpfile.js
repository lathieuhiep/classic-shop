'use strict';

const { src, dest, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');
const concat = require('gulp-concat');
const concatCss = require('gulp-concat-css');
const uglify = require('gulp-uglify');
const fileInclude = require('gulp-file-include');
const minifyCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const changed = require('gulp-changed');
const imagemin = require('gulp-imagemin');

const pathRoot = './app/';
const pathDestBuild = './build/';

// server
function server() {
    browserSync.init({
        server: pathDestBuild
    })
}

/**
 * Build libs
 * **/

//css
async function buildCssLibs() {
    return await src(`${pathRoot}assets/scss/libs/*.scss`)
        .pipe(sass().on('error', sass.logError))
        .pipe(minifyCss({
            level: {1: {specialComments: 0}}
        }))
        .pipe(rename( {suffix: '.min'} ))
        .pipe(dest(`${pathDestBuild}assets/libs/css`))
        .pipe(browserSync.stream())
}

async function buildWebFontsAwesome() {
    return await src([
        'node_modules/@fortawesome/fontawesome-free/webfonts/fa-brands-400.ttf',
        'node_modules/@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2',
        'node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf',
        'node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2'
    ])
        .pipe(dest(`${pathDestBuild}assets/libs/webfonts`))
        .pipe(browserSync.stream())
}

// js
async function buildJsLibs() {
    return await src([
        'node_modules/bootstrap/dist/js/bootstrap.bundle.js'
    ], {allowEmpty: true})
        .pipe(uglify())
        .pipe(rename( {suffix: '.min'} ))
        .pipe(dest(`${pathDestBuild}assets/libs/js`))
        .pipe(browserSync.stream())
}

async function buildLibs() {
    await buildCssLibs()
    await buildWebFontsAwesome()
    await buildJsLibs()
}
exports.buildLibs = buildLibs

/**
 * Build Template
 **/

// css main
async function buildStyle() {
    return await src(`${pathRoot}assets/scss/style.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(minifyCss({
            level: {1: {specialComments: 0}}
        }))
        .pipe(rename( {suffix: '.min'} ))
        .pipe(sourcemaps.write())
        .pipe(dest(`${pathDestBuild}assets/css`))
        .pipe(browserSync.stream());
}

// css page
async function buildStylePages() {
    return await src(`${pathRoot}assets/scss/pages/*.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(minifyCss({
            level: {1: {specialComments: 0}}
        }))
        .pipe(rename( {suffix: '.min'} ))
        .pipe(sourcemaps.write())
        .pipe(dest(`${pathDestBuild}assets/css/pages`))
        .pipe(browserSync.stream());
}

// js page
async function buildJsTemplate() {
    return await src(`${pathRoot}assets/js/**/*.js`, {allowEmpty: true})
        .pipe(uglify())
        .pipe(rename( {suffix: '.min'} ))
        .pipe(dest(`${pathDestBuild}assets/js/`))
        .pipe(browserSync.stream());
}

// optimize images
async function optimizeImages() {
    const imgSrc = `${pathRoot}assets/images/**/*.+(png|jpg|webp|svg|gif)`;
    const imgDst = `${pathDestBuild}assets/images`;

    return await src(imgSrc)
        .pipe(changed(imgDst))
        .pipe(imagemin())
        .pipe(dest(imgDst))
        .pipe(browserSync.stream());
}

async function buildTemplate() {
    await buildStyle()
    await buildStylePages()
    await buildJsTemplate()
    await optimizeImages()
}
exports.buildTemplate = buildTemplate

// Task include HTML
async function includeHTML() {
    return await src([`${pathRoot}pages/*.html`])
        .pipe(fileInclude({
            prefix: '@@',
            basepath: '@file',
            indent: true
        }))
        .pipe(dest(pathDestBuild))
        .pipe(browserSync.stream());
}
exports.includeHTML = includeHTML;

// build app first
async function buildApp() {
    await buildLibs()
    await buildTemplate()

    await includeHTML()
    await watchTask()
}
exports.buildApp = buildApp

// Task watch
function watchTask() {
    server()

    // watch build libs
    watch(`${pathRoot}assets/scss/libs/*.scss`, buildCssLibs)

    // watch build style css
    watch([
        `${pathRoot}assets/scss/**/*.scss`,
        `!${pathRoot}assets/scss/libs/*.scss`,
        `!${pathRoot}assets/scss/pages/*.scss`
    ], buildStyle)

    // watch build page css
    watch(`${pathRoot}assets/scss/pages/*.scss`, buildStylePages)

    // watch js
    watch(`${pathRoot}assets/js/**/*.js`, buildJsTemplate)

    // watch images
    watch(`${pathRoot}assets/images/**/*`, optimizeImages)

    // watch HTML
    watch(`${pathRoot}**/*.html`, includeHTML)

    // watch liveReload
    watch(`${pathDestBuild}**/*`, browserSync.reload)
}
exports.watchTask = watchTask
