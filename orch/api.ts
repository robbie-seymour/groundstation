import request from 'sync-request';
import fs from 'fs';

var API_KEY = null

//window.open('../secrets.json')
// idk lol
//*
const secrets_file = fs.readFileSync('../secrets.json', {flag: 'r'});
    try{
        API_KEY = JSON.parse(secrets_file['n2yo'])
    }
    catch (error) {
        API_KEY = null
        console.log("WARNING: NO SECRETS FILE SET");
    }
//*/
function send_reqs(args: string) {
    var req_url = `https://api.n2yo.com/rest/v1/satellite/${args}/&apiKey=${API_KEY}`
    try {
        const reqRes = request('GET', req_url);
        const reqJSON = JSON.stringify(reqRes)
        return reqJSON;
    } catch (error) {
        return error
    }

}

function get_whats_up(observer_lat=33.8688, observer_lng=151.2093,
    observer_alt=3, search_radius=75,category_id=0) {
        var args = (`above/${observer_lat}/${observer_lng}/
        ${observer_alt}/${search_radius}/${category_id}`);
        return send_reqs(args);
}

function get_radiopasses(norad_id=25544, observer_lat=33.8688, 
    observer_lng=151.2093, observer_alt=3, days=7, min_elevation=15) {
        var args = (`radiopasses/${norad_id}/${observer_lat}/${observer_lng}/${observer_alt}/${days}/${min_elevation}`)
        return send_reqs(args)
}

function get_visualpasses(norad_id=25544, observer_lat=33.8688, 
    observer_lng=151.2093, observer_alt=3, days=7, min_visibility=60) {
    const args = (`visualpasses/${norad_id}/${observer_lat}/${observer_lng}/
             ${observer_alt}/${days}/${min_visibility}`)
    return send_reqs(args);
}

function get_tle(norad_id=25544) {
    const args = (`tle/${norad_id}`)
    return send_reqs(args);
}

function get_positions(norad_id=25544, observer_lat=33.8688,
    observer_lng=151.2093, observer_alt=3, seconds=1) {
    const args = (`positions/${norad_id}/${observer_lat}/
    ${observer_lng}/${observer_alt}/${seconds}`)
    return send_reqs(args);
}
//*
function get_status() {
    // idk lol
    //return JSON.stringify();
}
//*/

export { get_whats_up, get_radiopasses, 
    get_visualpasses, get_tle, get_positions,
    get_status
}