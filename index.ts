import Adb, { Utils, Device } from '@u4/adbkit';
import PromiseDuplex from 'promise-duplex'
import { Duplex } from 'stream';

const entryPoint = 'com.github.gps/com.github.GPSActivity.Service';
const url = 'https://gps-coordinates.org/';
  
async function main() {
    const adbClient = Adb.createClient();
    const devices: Device[] = await adbClient.listDevices();
    if (!devices.length)
        throw Error('no device found');
    const device: Device = devices[0];
    console.log('using:', device);
    const client = device.getClient();
    console.log('try to start the Activity:', entryPoint);

    try {
        await client.startActivity({ action: entryPoint, wait:true });
    } catch (e) {
        console.error((e as Error).message);
        throw Error('failed to start activity ' + entryPoint);
    }
    await Utils.delay(1000);
    let socket: PromiseDuplex<Duplex>;
    try {
        socket = await client.openLocal2('localabstract:GPS');
    } catch (e) {
        console.error((e as Error).message);
        throw Error('failed to connect localabstract:GPS');
    }
    try {
        // setGeoloc to paris
        await socket.write('setpostion 48.856613, 2.352222\n');
    } catch (e) {
        console.error(e);
        throw Error('failed send setpostion command');
    }

    try {
        await Utils.waitforText(socket, 'Ok', 5000);
    } catch (e) {
        throw Error('GPS should replay Ok');
    }

    console.log('checking if it works');
    await client.startActivity({action: 'android.intent.action.VIEW', wait:true, data: url});
    // adb shell am start -a android.intent.action.VIEW -d 'http://stackoverflow.com/?uid=isme\&debug=true'
    console.log('click authorized in your screen');  
}

main().catch(console.error);