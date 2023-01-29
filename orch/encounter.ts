/*
Subsystem for generating encounters and transferring them to hardware.
Matt Rossouw (omeh-a)
05/2022
//*/
// import sleep from 'sleep';
//import {serial, serial.tools.list_ports} from 'serial';
import { get_whats_up, get_radiopasses, 
    get_visualpasses, get_tle, get_positions, get_status,
    //get_status
} from './api';

import { get_gps,
    //get_status
} from './geolocation';

const BAUDRATE = 115200;


/*
For now we generate encounters by just grabbing the entire list of positions from
the API. Since the API can return at most 300 seconds of positions, we just make multiple
requests to fulfill the full encounter. This is a temporary solution until we can perform
the kinematic analysis of the encounter to generate an exact path. Realistically, going
straight off the API has limited accuracy and is not at all adaptible to track any objects
that aren't already catalogued.

To start we will simply take the list of elevation/azimuth pairs and their timestamps, and
send these straight to hardware. This might be improved by calculating a weighting for each
step to help make a smoother and more accurate interpolation between steps.

//*/


function build_encounter(norad_id, lat, lng, alt) {
    /*
    Given a NORAD id and observer position, build an encounter.
    We need to put this into another thread to avoid blocking the server though,
    because we can calculate WHEN an encounter is, but only get satellite positions
    from the current moment onwards.

    Subsequently, we can calculate the passes and set
    the starting position at the start of the radio encounter. We then block until 3 seconds
    before the radio encounter begins to call get_positions for the first (up to) 300 seconds.
    This can be packaged up and sent to hardware, before sleeping again until 3 seconds before
    the next window (if it exists). Generally encounters are quite short however, so we shouldn't
    cause too much API spam with this method.
    //*/
    var port = null

    var radio_pass = null
    var time_to_generate = 0
    var prev_final_timestamp = null
    // Store our list steps in a single array. Each entry contains the time, elevation, and azimuth.
    // {"time" : time, "el" : el, "az" : az}
    var steps = []
    var found = null
    // Find the COM port for the motor controller. For now just take
    // the first one found.
    /*
    for ports in serial.tools.list_ports.comports():
        try:
            found = serial.Serial(ports.device, baudrate=BAUDRATE)

        except OSError:
            continue
    //*/
    if (found  == null) {
        //raise OSError("Microcontroller not detected.")
    }
    port = found

    // Open serial port
    //var ser = serial.Serial(port, BAUDRATE)

    // Get radio passes from API
    radio_pass = JSON.stringify(get_radiopasses(
        norad_id, lat, lng, alt))['passes'][0]

    // Update total seconds left
    // time_to_generate = radio_pass['duration']

    // Sleep until 10 seconds before the start of the radio pass
    // sleep(radio_pass['start'] - time.time() - 10)

    // Main segment for managing the encounter. Takes turns transferring
    // steps to the motor controller and getting new positions from the API;
    // blocking when inactive to avoid throttling the server.

    while (time_to_generate > 0) {
        // Get next 300 (or however much is left) seconds of positions
        if (time_to_generate < 300) {
            var secs = time_to_generate;
        }
        else {
            var secs = 300;
        }
        var new_steps = get_positions( radio_pass['sat'], radio_pass['start'] + secs)

        var new_final = null

        // Ignore all entries from steps with a timestamp later than the final timestamp
        // of the previous encounter.
        if (prev_final_timestamp !== null) {
            for (const step of new_steps) {
                if (step['timestamp'] >= prev_final_timestamp) {
                    new_steps.remove(step)
                }
                new_final = step['timestamp']
            }
        }
        // Swap to new set of steps
        steps = new_steps

        // Update final timestamp
        prev_final_timestamp = new_final

        // Subtract time from time_to_generate
        time_to_generate -= secs

        // Asynchronously transfer steps to hardware
        transfer_steps(steps, port, ser)
    }
}
async function transfer_steps(steps, port, ser) {
    /*
    Send steps to hardware and purge buffer.
    TODO: find a way to distinguish between the motor COM port and
          the geolocation COM port
    //*/
    try {
        //ser = serial.Serial(port, BAUDRATE)
    }
    catch (OSError) {
        console.log("WARNING: Failed to reopen serial port during an encounter.")
    }
    // Transfer steps
    for (const step in steps){
        // Build string to send to motor controller

        // Convert azimuth and elevation to fixed point
        const az_i = Number(step["az"])  // integer portion
        const az_dec = Number((step["az"] - az_i) * 10**3) // first 4 decimal places

        const el_i = Number(step["el"])
        const el_dec = Number((step["el"] - el_i) * 10**3) // first 4 decmial places

        const m_string = `${az_i}.${az_dec},${el_i}.${el_dec}\0`
        ser.write(encodeURI(m_string))

    // Clear buffer, except for very last position.
        var last = steps[steps.len() - 1]
        steps = [last];
    }
}

export {build_encounter, transfer_steps}