import { quaternionToEuler } from './quaternion-to-euler';

export class LithoHardware {
    constructor() {
        this.orientation = {
            w: 0,
            x: 0,
            y: 0,
            z: 0,
        };

        this.euler = {
            x: 0,
            y: 0,
            z: 0,
        };

        this.accel = {
            x: 0,
            y: 0,
            z: 0,
        };

        this.touch = {
            x: 0,
            y: 0,
            isTouching: false,
            swipe: (0x20 | 0x10 | 0x08 | 0x04),
            tapAndHold: false,
            singleTap: false,
        };

        this.unused = 0x0;
        this.misc_flags = 0x0;
    }

    async connect() {
        const LITHO_SERVICE = '6e40fe55-b5a3-f393-e0a9-e50e24dcca9e';
        const UPDATE_CHARACTERISTCIC = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

        let device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'Litho' }
            ],
            optionalServices: [
                'device_information',
                'battery_service',
                LITHO_SERVICE
            ],
        });

        await device.gatt.connect();


        let UTF8Decoder = new TextDecoder('utf8');

        let info = await device.gatt.getPrimaryService('device_information');

        let hw_character = await info.getCharacteristic('hardware_revision_string');
        let hardware = UTF8Decoder.decode(await hw_character.readValue());
        let fw_character = await info.getCharacteristic('firmware_revision_string');
        let firmware = UTF8Decoder.decode(await fw_character.readValue());

        let battery = await device.gatt.getPrimaryService('battery_service');
        let level_character = await battery.getCharacteristic('battery_level');
        let level = (await level_character.readValue()).getUint8(0);

        let service = await device.gatt.getPrimaryService(LITHO_SERVICE);
        let updater = await service.getCharacteristic(UPDATE_CHARACTERISTCIC);
        updater.addEventListener('characteristicvaluechanged', this);
        await updater.startNotifications();

        // 		this.level = (await (await battery.getCharacteristic('battery_level')).readValue()).getUint8(0);

        // 		this.serial = await (await info.getCharacteristic('serial_number_string')).readValue();
        // 		this.hardware = await (await info.getCharacteristic('hardware_revision_string')).readValue();
        // 		this.firmware = await (await info.getCharacteristic('firmware_revision_string')).readValue();

        Object.assign(this, { device, hardware, firmware, level, service });
    }

    async getBatteryLevel() {
        let battery = await this.device.gatt.getPrimaryService('battery_service');
        let level_character = await battery.getCharacteristic('battery_level');
        let level = (await level_character.readValue()).getUint8(0);
        return level;
    }

    async write(data) {
        const RX_CHARACTERISTIC = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
        let characteristic = await this.service.getCharacteristic(RX_CHARACTERISTIC);
        return characteristic.writeValue(new Uint8Array(data));
    }

    handleEvent(event) {
        if (event.type === 'characteristicvaluechanged') this.handleData(event);
    }

    handleData(event) {
        var data = event.target.value;

        this.orientation.w = data.getInt16(0, true) / 65534;
        this.orientation.x = data.getInt16(2, true) / 65534;
        this.orientation.y = data.getInt16(4, true) / 65534;
        this.orientation.z = data.getInt16(6, true) / 65534;

        const [x, y, z] = quaternionToEuler([
            this.orientation.w,
            this.orientation.x,
            this.orientation.y,
            this.orientation.z,
        ]);

        this.euler.x = x;
        this.euler.y = y;
        this.euler.z = z;

        this.accel.x = (data.getInt16(8, true) / 65534) * 8;
        this.accel.y = (data.getInt16(10, true) / 65534) * 8;
        this.accel.z = (data.getInt16(12, true) / 65534) * 8;

        this.touch.x = (data.getUint8(14) / 255);
        this.touch.y = (data.getUint8(15) / 255);

        let touch_flags = data.getUint8(16);
        this.touch.isTouching = !!(touch_flags & 0x40);
        this.touch.swipe = touch_flags & (0x20 | 0x10 | 0x08 | 0x04);
        this.touch.tapAndHold = !!(touch_flags & 0x02);
        this.touch.singleTap = !!(touch_flags & 0x01);

        this.unused = data.getUint16(17, true).toString(16);
        this.misc_flags = data.getUint8(19);

        this.onStateChangeCallback(this);
    }

    onStateChangeCallback(device) { }
    onStateChange(callback) {
        this.onStateChangeCallback = callback;
    }
}
