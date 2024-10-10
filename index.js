const { getFreeRooms } = require('./utils');


async function main() {
    const freeRooms = await getFreeRooms();
    console.log('Salles libres:', freeRooms);
}

main();