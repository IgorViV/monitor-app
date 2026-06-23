import { REGION_CAPITALS } from '../utils/constants.js';
import {float} from "jsdom/lib/generated/css-property-descriptors.js";

function getIconPosition(region, regionIconLength) {
    let offsetX = 0;
    let offsetY = 0;
    if (REGION_CAPITALS[region].float === 'left') {
        offsetX = - (regionIconLength * 60 / 2 + 40);
        offsetY = - 30;
    }
    if (REGION_CAPITALS[region].float === 'top') {
        offsetX = - 30;
        offsetY = - 70;
    }
    if (REGION_CAPITALS[region].float === 'right') {
        offsetX = (regionIconLength * 60 / 2 - 30);
        offsetY -= 30;
    }
    if (REGION_CAPITALS[region].float === 'bottom') {
        offsetX = - 30;
        offsetY = 10;
    }

    return [offsetX, offsetY];
}

export function generateIcon(reportData) {

    let usesIcon = [];
    let regionIcons = {};
    let iconType = '';
    let coordX = 0;
    let coordY = 0;

    for (let federal of Object.keys(reportData)) {

        if ((Object.keys(reportData[federal].flood).length > 0)) {
            for (let region of Object.keys(reportData[federal].flood)) {
                if (region in regionIcons) {
                    regionIcons[region].push('flood')
                } else {
                    regionIcons[region] = ['flood'];
                }
            }
        }
        if ((Object.keys(reportData[federal].fire).length > 0)) {
            for (let region of Object.keys(reportData[federal].fire)) {
                if (region in regionIcons) {
                    regionIcons[region].push('fire')
                } else {
                    regionIcons[region] = ['fire'];
                }
            }
        }
        if ((Object.keys(reportData[federal].storm).length > 0)) {
            for (let region of Object.keys(reportData[federal].storm)) {
                const regionStormData = reportData[federal].storm[region];
                for (let element of regionStormData) {
                    for (let icon of element.icons) {
                        if (region in regionIcons) {
                            regionIcons[region].push(icon)
                        } else {
                            regionIcons[region] = [icon];
                        }
                    }
                }
            }
        }
    }
    for (let region of Object.keys(regionIcons)) {
        let regionIcon = new Set(regionIcons[region]);
        regionIcon = [...regionIcon];
        if (regionIcon.length === 1) {
            const iconType = regionIcons[region][0];
            coordX = REGION_CAPITALS[region].x;
            coordY = REGION_CAPITALS[region].y;
            coordX += getIconPosition(region, regionIcon.length)[0];
            coordY += getIconPosition(region, regionIcon.length)[1];
            const iconUse = `<use xlink:href="#icon-${iconType}" x="${coordX}" y="${coordY}" width="60" height="60"/>`;
            usesIcon.push(iconUse);
        }
        if (regionIcon.length > 1) {
            let offsetX = 0;
            let offsetY = 0;
            regionIcon.forEach(icon => {
                const iconType = icon;
                coordX = REGION_CAPITALS[region].x + offsetX - (regionIcon.length * 60 / 2 - 30);
                coordY = REGION_CAPITALS[region].y + offsetY;
                coordX += getIconPosition(region, regionIcon.length)[0];
                coordY += getIconPosition(region, regionIcon.length)[1];
                const iconUse = `<use xlink:href="#icon-${iconType}" x="${coordX}" y="${coordY}" width="60" height="60"/>`;
                usesIcon.push(iconUse);
                offsetX += 60;
            });
        }
    }

    return usesIcon;
}