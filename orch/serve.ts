//import logging;
//import threading
//import time
//from json import dumps
import apis from 'api';
// import geolocation
//from flask import Flask, request, jsonify, Response
import express from 'express';
import errorHandler from 'middleware-http-errors';
import cors from 'cors';
import HTTPError from 'http-errors';
import morgan from 'morgan';
import config from './config.json';

// Encounter imports

// import {encounter} from './encounter';

import { get_whats_up, get_radiopasses, 
    get_visualpasses, get_tle, get_positions, get_status,
    //get_status
} from './api';

import { get_gps,
    //get_status
} from './geolocation';

var encounterThread = null

const APP = express();
APP.use(express.json());
APP.use(cors());

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

APP.get('/whats_up', (req, res) => {
    const observer_lat = req.header('observer_lat', 33.8688)
    const observer_lng = req.header('observer_lng', 151.2093)
    const observer_alt = req.header('observer_alt', 3)
    const search_radius = req.header('search_radius', 75)
    const category_id = req.header('category_id', 0)
    const api_result = get_whats_up(observer_lat, observer_lng, 
    observer_alt, search_radius, category_id);
    res.json ({
        api_result: api_result
    });
});


APP.get('/radiopasses', (req, res) => {
    const norad_id = req.header('norad_id', 25544)
    const observer_lat = req.header('observer_lat', 33.8688)
    const observer_lng = req.header('observer_lng', 151.2093)
    const observer_alt = req.header('observer_alt', 3)
    const days = req.header('days', 7)
    const min_elevation = req.header('min_elevation', 15)
    const api_result = get_radiopasses(norad_id, observer_lat, 
        observer_lng, observer_alt, days, min_elevation);
    res.json ({
        api_result: api_result
    });
});

APP.get('/visualpasses', (req, res) => {
    const norad_id = req.header('norad_id', 25544)
    const observer_lat = req.header('observer_lat', 33.8688)
    const observer_lng = req.header('observer_lng', 151.2093)
    const observer_alt = req.header('observer_alt', 3)
    const days = req.header('days', 7)
    const min_visibility = req.header('min_visibility', 60)
    const api_result = get_visualpasses(
        norad_id, observer_lat, observer_lng, observer_alt, days, min_visibility)
    return_handler(res, api_result);

});

APP.get('/gettle', (req, res) => {
    const norad_id = req.header('norad_id', 25544)
    const api_result = get_tle(norad_id)
    return_handler(res, api_result);

});

APP.get('/getpositions', (req, res) => {
    const norad_id = req.header('norad_id', 25544)
    const observer_lat = req.header('observer_lat', 33.8688)
    const observer_lng = req.header('observer_lng', 151.2093)
    const observer_alt = req.header('observer_alt', 3)
    const seconds = req.header('seconds', 1)
    const api_result = get_positions(
        norad_id, observer_lat, observer_lng, observer_alt, seconds)
    return_handler(res, api_result);
});

APP.get('/position', (req, res) => {
    try {
        const api_result = get_gps()
        return_handler(res, api_result);
    }
    catch(Error) {
        throw HTTPError(404, 'description');
    }

});
APP.get('/status', (req, res) => {

    try {
        const curr_status = get_status();
        return res.json({
           status: curr_status
        });
    }
    catch {Error} {
    throw HTTPError(404, Error);
    }

});
// unsure
APP.get('/start_encounter', (req, res) => {
/*
    format = "%(asctime)s: %(message)s"

    logging.basicConfig(format=format, level=logging.INFO, datefmt="%H:%M:%S")
    while True:
        if encounter_thread is None:
            logging.info("Starting encounter thread")
            # We set daemon=True to force this thread to exit when the main thread exits.
            encounter_thread = threading.Thread(
                target=build_encounter, args=(), daemon=True)
            encounter_thread.start()
            break
        else:
            encounter_thread.end()
//*/
});

function return_handler(api_result, res) {
    try {
        res.json ({
            api_result: api_result
        });
    }
    catch (TypeError){
        throw HTTPError(404, `{{"Error": "${api_result}"}}`);
    }
}

// also unsure
function default_handler(err) {

    const response = err.get_response()
    response.data = {
        "code": err.code,
        "name": "System Error",
        "message": err.get_description(),
    }
    response.content_type = 'application/json'
    return response
}

// handles errors nicely
APP.use(errorHandler());
// for logging errors
APP.use(morgan('dev'));

// start server
const server = APP.listen(PORT, HOST, () => {
  console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
});
// unsure
APP.register_error_handler(default_handler);

process.on('SIGINT', () => {
    server.close(() => console.log('Shutting down server gracefully.'));
});
  