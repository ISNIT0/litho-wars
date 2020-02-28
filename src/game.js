import { LithoHardware } from './litho';
import uw, { World, Sprite, Sound } from 'you-win';

export async function game() {

    // Load everything we need
    uw.loadCostume('xwing', 'xwing.png')
    uw.loadCostume('space', 'space.png')
    uw.loadCostume('laser', 'laser.png')
    uw.loadCostume('begin', 'begin.png')
    uw.loadCostume('startText', 'startText.png')
    uw.loadCostume('gameover', 'gameover.png')
    uw.loadCostume('tie', 'tie.png')
    uw.loadCostume('startText', 'startText.png')
    uw.loadCostume('explosion', 'explosion.png')
    uw.loadCostume('introText', 'introText.png')

    uw.loadSound('pew', 'pew.mp3')
    uw.loadSound('tiedie', 'tiedie.mp3')
    uw.loadSound('wilhelm', 'wilhelm.mp3')
    uw.loadSound('xwingdeath', 'xwingdeath.mp3')
    uw.loadSound('scherzo', 'scherzo.mp3')
    uw.loadSound('imperialMarch', 'imperialMarch.mp3')
    await uw.begin()

    var pewNoise = new Sound('pew')
    var tieDieNoise = new Sound('tiedie')
    var wilhelmNoise = new Sound('wilhelm')
    var xwingDeathNoise = new Sound('xwingdeath')
    var scherzoNoise = new Sound('scherzo')
    var imperialMarchNoise = new Sound('imperialMarch')
    // Make the world
    var world = new World
    world.title = ''
    world.background = '#000'



    const bg = new Sprite
    bg.costume = 'space'
    bg.width = world.width
    bg.height = world.height
    // bg.posX = 0
    // bg.posY = 0

    const intervals = [];

    const startText = new Sprite
    startText.costume = 'startText'
    startText.width = world.width / 2;

    let hasStarted = false;
    world.onTap(() => {
        if (!hasStarted) {
            startText.destroy();
            hasStarted = true;
            scherzoNoise.play();

            const introText = new Sprite
            introText.costume = 'introText'
            introText.width = world.width;
            introText.top = 0;
            introText.onTap(() => {
                introText.destroy();
                startGame();
            })
            introText.forever(() => {
                introText.posY += 2.5;
                if (!introText.isOnScreen()) {
                    introText.destroy();
                    startGame();
                }
            })
        }
    })

    // startGame()

    function gameOver() {
        intervals.forEach(clearInterval);
        const gameOver = new Sprite
        gameOver.costume = 'gameover'
        // gameOver.posX = 0;
        // gameOver.posY = 0;
        gameOver.width = world.width;
        gameOver.height = world.height;
        scherzoNoise.source.stop();
        imperialMarchNoise.play();
    }

    function makeEnemy(player) {
        const enemy = new Sprite
        enemy.costume = 'tie'
        enemy.scale = 0.3;
        const randomY = Math.random() * world.height;
        enemy.top = randomY;
        if (Math.random() < 0.5) {
            enemy.right = 0;
        } else {
            enemy.left = world.width;
        }
        var dx = player.posX - enemy.posX;
        var dy = player.posY - enemy.posY;

        enemy.forever(() => {
            enemy.posX += dx * 0.01;
            enemy.posY += dy * 0.01;
            enemy.scale = Math.min(enemy.scale * 1.008, 3);
            if (!enemy.isOnScreen()) {
                enemy.destroy();
            }
            if (enemy.isTouching(player)) {
                player.destroy();
                enemy.destroy();
                // tieDieNoise.play();
                wilhelmNoise.play();
                xwingDeathNoise.play();
                const explosion = new Sprite
                explosion.costume = 'explosion'
                explosion.posX = player.posX
                explosion.posY = player.posY
                explosion.scale = 0.4
                explosion.forever(() => {
                    explosion.scale = Math.min(explosion.scale * 1.3, 5);
                });
                setTimeout(() => {
                    gameOver();
                }, 1000);
            }
        });
    }

    function startGame() {
        const clickToPlay = new Sprite;
        clickToPlay.costume = 'begin'
        clickToPlay.width = world.width / 2;

        world.onTap(async () => {
            clickToPlay.destroy();
            const litho = new LithoHardware();
            await litho.connect();
            console.log(`Connected`);
            var player = new Sprite
            player.costume = 'xwing'
            let scaleAmount = 0.95
            player.scale = 4;
            player.forever(() => {
                player.scale *= scaleAmount;
            })
            setTimeout(() => {
                player.scale = 0.3
                scaleAmount = 1.0005;
            }, 1000)
            intervals.push(setInterval(() => {
                makeEnemy(player);
            }, 3000));
            let touchPos = { x: 0, y: 0 };
            litho.onStateChangeCallback = function (data) {
                // console.log(player.posX, data.euler.x);
                player.angle = data.euler.x * 200;
                player.posX += data.euler.x * 45;
                player.posY -= (data.euler.y * 45 * 1.5);
                // player.scale += ((data.touch.x || 0.5) - 0.5);

                if (data.touch.x) {
                    touchPos.x = data.touch.x;
                    touchPos.y = data.touch.y;
                }

                if (data.touch.singleTap) {
                    pewNoise.play();
                    // const explosionLeft = new Sprite
                    // explosionLeft.costume = 'explosion'
                    // explosionLeft.forever(() => {
                    //     explosionLeft.posX = player.left
                    //     explosionLeft.posY = player.posY
                    // })
                    // const explosionRight = new Sprite
                    // explosionRight.costume = 'explosion'
                    // explosionRight.forever(() => {
                    //     explosionRight.posX = player.right
                    //     explosionRight.posY = player.posY
                    // })

                    const laserLeft = new Sprite
                    laserLeft.costume = 'laser'
                    laserLeft.scale = 3
                    laserLeft.posX = world.width - (world.width * touchPos.x);
                    laserLeft.posY = world.height - (world.height * touchPos.y);
                    laserLeft.forever(() => {
                        laserLeft.scale = laserLeft.scale * 1.3
                        laserLeft.opacity = laserLeft.opacity * 0.95

                        if (laserLeft.scale < 10) {
                            for (let obj of laserLeft.getTouching()) {
                                if (obj.costume === 'tie') {
                                    tieDieNoise.play();
                                    const explosion = new Sprite
                                    explosion.costume = 'explosion'
                                    explosion.posX = obj.posX
                                    explosion.posY = obj.posY
                                    explosion.scale = 0.4;
                                    explosion.forever(() => {
                                        explosion.scale *= 1.4;
                                    })
                                    setTimeout(() => {
                                        explosion.destroy();
                                    }, 200)
                                    obj.destroy();
                                }
                            }
                        }
                    })

                    setTimeout(() => {
                        // explosionLeft.destroy()
                        // explosionRight.destroy()
                        laserLeft.destroy()
                    }, 200)
                }
            }
        });
    }
}



//     class LithoHardware {
//         constructor() {
//             this.orientation = {
//                 w: 0,
//                 x: 0,
//                 y: 0,
//                 z: 0,
//             };

//             this.euler = {
//                 x: 0,
//                 y: 0,
//                 z: 0,
//             };

//             this.accel = {
//                 x: 0,
//                 y: 0,
//                 z: 0,
//             };

//             this.touch = {
//                 x: 0,
//                 y: 0,
//                 isTouching: false,
//                 swipe: (0x20 | 0x10 | 0x08 | 0x04),
//                 tapAndHold: false,
//                 singleTap: false,
//             };

//             this.unused = 0x0;
//             this.misc_flags = 0x0;
//         }

//         async connect() {
//             const LITHO_SERVICE = '6e40fe55-b5a3-f393-e0a9-e50e24dcca9e';
//             const UPDATE_CHARACTERISTCIC = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

//             let device = await navigator.bluetooth.requestDevice({
//                 filters: [
//                     { namePrefix: 'Litho' }
//                 ],
//                 optionalServices: [
//                     'device_information',
//                     'battery_service',
//                     LITHO_SERVICE
//                 ],
//             });

//             await device.gatt.connect();


//             let UTF8Decoder = new TextDecoder('utf8');

//             let info = await device.gatt.getPrimaryService('device_information');

//             let hw_character = await info.getCharacteristic('hardware_revision_string');
//             let hardware = UTF8Decoder.decode(await hw_character.readValue());
//             let fw_character = await info.getCharacteristic('firmware_revision_string');
//             let firmware = UTF8Decoder.decode(await fw_character.readValue());

//             let battery = await device.gatt.getPrimaryService('battery_service');
//             let level_character = await battery.getCharacteristic('battery_level');
//             let level = (await level_character.readValue()).getUint8(0);

//             let service = await device.gatt.getPrimaryService(LITHO_SERVICE);
//             let updater = await service.getCharacteristic(UPDATE_CHARACTERISTCIC);
//             updater.addEventListener('characteristicvaluechanged', this);
//             await updater.startNotifications();

//             // 		this.level = (await (await battery.getCharacteristic('battery_level')).readValue()).getUint8(0);

//             // 		this.serial = await (await info.getCharacteristic('serial_number_string')).readValue();
//             // 		this.hardware = await (await info.getCharacteristic('hardware_revision_string')).readValue();
//             // 		this.firmware = await (await info.getCharacteristic('firmware_revision_string')).readValue();

//             Object.assign(this, { device, hardware, firmware, level, service });
//         }

//         async getBatteryLevel() {
//             let battery = await this.device.gatt.getPrimaryService('battery_service');
//             let level_character = await battery.getCharacteristic('battery_level');
//             let level = (await level_character.readValue()).getUint8(0);
//             return level;
//         }

//         async write(data) {
//             const RX_CHARACTERISTIC = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
//             let characteristic = await this.service.getCharacteristic(RX_CHARACTERISTIC);
//             return characteristic.writeValue(new Uint8Array(data));
//         }

//         handleEvent(event) {
//             if (event.type === 'characteristicvaluechanged') this.handleData(event);
//         }

//         handleData(event) {
//             var data = event.target.value;

//             this.orientation.w = data.getInt16(0, true) / 65534;
//             this.orientation.x = data.getInt16(2, true) / 65534;
//             this.orientation.y = data.getInt16(4, true) / 65534;
//             this.orientation.z = data.getInt16(6, true) / 65534;

//             const [x, y, z] = quaternionToEuler([
//                 this.orientation.w,
//                 this.orientation.x,
//                 this.orientation.y,
//                 this.orientation.z,
//             ]);

//             this.euler.x = x;
//             this.euler.y = y;
//             this.euler.z = z;

//             this.accel.x = (data.getInt16(8, true) / 65534) * 8;
//             this.accel.y = (data.getInt16(10, true) / 65534) * 8;
//             this.accel.z = (data.getInt16(12, true) / 65534) * 8;

//             this.touch.x = (data.getUint8(14) / 255);
//             this.touch.y = (data.getUint8(15) / 255);

//             let touch_flags = data.getUint8(16);
//             this.touch.isTouching = !!(touch_flags & 0x40);
//             this.touch.swipe = touch_flags & (0x20 | 0x10 | 0x08 | 0x04);
//             this.touch.tapAndHold = !!(touch_flags & 0x02);
//             this.touch.singleTap = !!(touch_flags & 0x01);

//             this.unused = data.getUint16(17, true).toString(16);
//             this.misc_flags = data.getUint8(19);

//             /*
//             typedef struct  {
//                 int16_t ori_w;
//                 int16_t ori_x;
//                 int16_t ori_y;
//                 int16_t ori_z;
//                 int16_t accel_x;
//                 int16_t accel_y;
//                 int16_t accel_z;
//                 uint8_t touch_x;
//                 uint8_t touch_y;
//                 uint8_t touch_flags;
//                 int16_t unused;
//                 uint8_t misc_flags;
//             } __attribute__((packed))
//             litho_state_t;
//             */

//             this.onStateChangeCallback(this);
//         }

//         onStateChangeCallback(device) { }
//         onStateChange(callback) {
//             this.onStateChangeCallback = callback;
//         }
//     }



//     function quaternionToEuler(quat) {

//         const q0 = quat[0];
//         const q1 = quat[1];
//         const q2 = quat[2];
//         const q3 = quat[3];

//         const Rx = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - (2 * (q1 * q1 + q2 * q2)));
//         const Ry = Math.asin(2 * (q0 * q2 - q3 * q1));
//         const Rz = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - (2 * (q2 * q2 + q3 * q3)));

//         const euler = [Rx, Ry, Rz];

//         return (euler);
//     };
// }
