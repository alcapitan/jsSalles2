const axios = require('axios');

function toDate(dt) {
    const year = dt.substring(0, 4);
    const month = dt.substring(4, 6) - 1;
    const day = dt.substring(6, 8);
    const hour = dt.substring(9, 11);
    const minute = dt.substring(11, 13);
    const second = dt.substring(13, 15);
    const eventDate = new Date(Date.UTC(year, month, day, hour, minute, second));

    return eventDate;
}

function getClassCourses(url) {
    return axios.get(url)
        .then(response => {
            const data = response.data;

            const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
            const events = [];
            let match;

            while ((match = eventRegex.exec(data)) !== null) {
                const eventBlock = match[1];

                const dtstartMatch = eventBlock.match(/DTSTART(;VALUE=DATE)?:([^\r\n]*)/);
                const dtendMatch = eventBlock.match(/DTEND(;VALUE=DATE)?:([^\r\n]*)/);
                const summaryMatch = eventBlock.match(/SUMMARY;LANGUAGE=fr:([^\r\n]*)/);
                const locationMatch = eventBlock.match(/LOCATION;LANGUAGE=fr:([^\r\n]*)/);
                const descriptionMatch = eventBlock.match(/DESCRIPTION;LANGUAGE=fr:([^\r\n]*)/);

                const dtstart = dtstartMatch ? dtstartMatch[2].trim() : null;
                const dtend = dtendMatch ? dtendMatch[2].trim() : null;
                const summary = summaryMatch ? summaryMatch[1].trim() : null;
                const location = locationMatch ? locationMatch[1].trim() : 'Non spécifié';
                const description = descriptionMatch ? descriptionMatch[1].trim() : 'Non spécifié';

                if (dtstart && dtend && summary) {
                    const event = {
                        dtstart,
                        dtend,
                        summary,
                        location,
                        description
                    };

                    events.push(event);
                } else {
                    console.warn('Un événement n\'a pas pu être extrait correctement:', eventBlock);
                }
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayEvents = events.filter(event => {
                const year = event.dtstart.substring(0, 4);
                const month = event.dtstart.substring(4, 6) - 1;
                const day = event.dtstart.substring(6, 8);
                const hour = event.dtstart.substring(9, 11);
                const minute = event.dtstart.substring(11, 13);
                const second = event.dtstart.substring(13, 15);
                const eventDate = new Date(Date.UTC(year, month, day, hour, minute, second));

                return eventDate.getDate() == today.getDate() && eventDate.getMonth() == today.getMonth() && eventDate.getFullYear() == today.getFullYear();
            });

            return todayEvents; // Move return statement here
        })
        .catch(error => {
            console.log(url);
            console.error('Erreur lors de la récupération des données:', error);
        });
}

function isClassFree(courses) {
    let nextCourse = null;
    let nextCourseDiff = null;
    if (courses.length === 0) { return { free: true, nextCourse: nextCourse }; }
    const now = new Date();

    for (const course of courses) {
        if (!course || !course.dtstart || !course.dtend) {
            console.warn('Invalid course data:', course);
            continue;
        }

        const courseStart = toDate(course.dtstart);
        const courseEnd = toDate(course.dtend);

        // La salle est occupée
        if (courseStart < now && courseEnd > now) {
            return { free: false, courses: courses };
        } else if (nextCourse != null) {
            // Si le cours est dans le futur
            if (courseStart > now) {
                const diff = courseStart - toDate(nextCourse.dtstart);
                if (diff < nextCourseDiff) {
                    nextCourseDiff = diff;
                    nextCourse = course;
                }
            }
        } else if (nextCourse == null) {
            if (courseStart > now) {
                nextCourseDiff = courseStart - now;
                nextCourse = course;
            }
        }
    }

    return { free: true, nextCourse: nextCourse };
}

const fs = require('fs');
const path = require('path');
const roomsFilePath = path.join(__dirname, 'rooms.json');
const roomsData = JSON.parse(fs.readFileSync(roomsFilePath, 'utf8'));

async function getFreeRooms() {
    let freeRooms = {};
    const promises = roomsData.rooms.map(async (room) => {
        if (room.url == undefined) {
            console.log(room);
            console.error('Error: URL not defined for room:', room);
            return;
        }
        try {
            const courses = await getClassCourses(room.url);
            const classStatus = isClassFree(courses);
            if (classStatus.free) {
                freeRooms[room.name] = classStatus;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    await Promise.all(promises);
    return freeRooms;
}

module.exports = {
    toDate,
    getClassCourses,
    isClassFree,
    getFreeRooms
};