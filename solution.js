'use strict';

const rPromise = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const { start } = require('repl');


const options = {
    url:'https://www.bankmega.com/promolainnya.php',
    transform: body => cheerio.load(body)
};
const startExecution = new Date();
let queryParam = '?subcat=';
global.PromoCategories = [];

rPromise(options)
.then(function($){
    let categories = [];
    $('#subcatpromo').find('div > img').each((i, value) => {
        categories.push($(value).attr('title'));
    });
    FindCategoriesIndex(categories);
})
.catch((err) => {
    console.log(err);
});

function FindCategoriesIndex(categories){
    let i = 1;
    function next(){
        if(i <= categories.length){
            let options = {
                url: 'https://www.bankmega.com/promolainnya.php' + queryParam + i,
                transform: body => cheerio.load(body)
            }
            rPromise(options)
                .then(function($) {
                    let selectedCategory = $('#subcatselected').find('img').attr('title');
                    ++i;
                    let endPointPromo = [];
                    $('#promolain').find('li > a').each((i, value) => {
                        endPointPromo.push($(value).attr('href'));
                    });
                    GetPromoDetail(endPointPromo, selectedCategory, i, categories.length);
                    return next();
            })
            .catch((err) => {
                console.log(err);
            });
        }
    }
    return next();
}

function GetPromoDetail(endPointPromo, selectedCategory, index, length){
    let i = 0;
    let result = [];
    function next(){
        if(i < endPointPromo.length){
            let options = {
                url : 'https://www.bankmega.com/' + endPointPromo[i],
                transform : body => cheerio.load(body)
            }
            rPromise(options)
                .then(function($){
                    let promoObject = new Object()
                    promoObject.title = $('.titleinside').find('h3').text();
                    promoObject.area = $('.area').find('b').text();
                    $('.periode').find('b').each((idx, value) => {
                        if(idx == 0){
                            promoObject.validUntil = $(value).text();
                        }
                        else{
                            promoObject.validFrom = $(value).text();
                        }
                    });
                    promoObject.image = 'https://www.bankmega.com/' + $('.keteranganinside').find('img').attr('src');
                    ++i;
                    result.push(promoObject);
                    return next();
                }
            )
            .catch((err) => {
                console.log(err);
            });
        }
        else{
            let categoryResult = {};
            categoryResult[selectedCategory] =  result;
            PromoCategories.push(categoryResult);
            if(index === length){
                SaveResult(PromoCategories);
                var end = new Date() - startExecution;
                console.info('Execution time: %dms', end);
            }
        }
    }
    return next();
}

function SaveResult(result){
    var jsonResult = JSON.stringify(result);
    fs.writeFile('./solution.json', jsonResult, err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Saved as solution.json')
        }
    })
}