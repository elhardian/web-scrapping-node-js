'use strict';

const sRequest = require('sync-request');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');


const url = 'https://www.bankmega.com/promolainnya.php';
const final = new Object();
const startExecution = new Date();

request(url, async function (error, response, html) {
    if (!error && response.statusCode == 200) {
        var $ = cheerio.load(html);
        let categories = [];
        $('#subcatpromo').find('div > img').each((i, value) => {
            categories.push($(value).attr('title'));
        });
        var indices = [categories.length];
        var i;
        for(i = 0; i < categories.length;i++) indices[i]=i+1;
        
        const promises = indices.map(async index => {
            findPromoId(index);
        })
        await Promise.all(promises);
        SaveResult(final);
        var end = new Date() - startExecution;
        console.info('Execution time: %dms', end);
    }
})

async function findPromoId(index){
    var urlCategory = url + '?subcat=' + index;
    var result = new Object();
    var response = sRequest('GET',urlCategory);
    var $ = cheerio.load(response.body);
    let selectedCategory = $('#subcatselected').find('img').attr('title');
    let endPointPromo = [];
    $('#promolain').find('li > a').each((i, value) => {
        endPointPromo.push($(value).attr('href'));
    });
    const promises = endPointPromo.map(async endPoint => {
        var promos = GetPromoDetail(endPoint);
        return promos;
    })
    var promosDetail = await Promise.all(promises);
    final[selectedCategory] = promosDetail;
}

function GetPromoDetail(endPoint){
    var urlDetailPromo = 'https://www.bankmega.com/' + endPoint;
    var response = sRequest('GET',urlDetailPromo);
    var $ = cheerio.load(response.body);
    var result = new Object();
    result.title = $('.titleinside').find('h3').text();
    result.area = $('.area').find('b').text();
    $('.periode').find('b').each((idx, value) => {
        if(idx == 0){
            result.validUntil = $(value).text();
        }
        else{
            result.validFrom = $(value).text();
        }
    });
    result.image = 'https://www.bankmega.com/' + $('.keteranganinside').find('img').attr('src');
    return result;
}

function SaveResult(result){
    var jsonResult = JSON.stringify(result);
    fs.writeFile('./solution2.json', jsonResult, err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('solution2.json')
        }
    })
}
