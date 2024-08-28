import { platform } from "@floating-ui/dom";



/**
 * Converts a platform name to a svg file name
 * @param {string} platform_name 
 * @returns 
 */
function platform_to_svg_name(platform_name) {

    platform_name = platform_name.toLowerCase()
    platform_name = platform_name.replace(/\s/g, '');

    if (platform_name == "pc" || platform_name == "windows" || platform_name == "mac" || platform_name == "linux" || platform_name == "stream") {
        return "PC.svg";
    } else if (platform_name == "ps4" || platform_name == "ps5" || platform_name == "ps1" || platform_name == "ps2" || platform_name == "ps3") {
        return "PSN.svg";
    } else if (platform_name == "switch" || platform_name == "wii" || platform_name == "wiiu" || platform_name == "dolphine" || platform_name == "ds"
            || platform_name == "3ds" || platform_name == "gamecube" || platform_name == "gameboy" || platform_name == "gba" || platform_name == "n64") {
        return "Nintendo.svg";
    } else if (platform_name == "netflix") {
        return "Netflix.svg";
    } else if (platform_name == "cineplex") {
        return "Cineplex.svg";
    } else if (platform_name == "disney" || platform_name == "disney+") {
        return "Disney.svg";
    } else if (platform_name == "crave") {
        return "Crave.svg";
    }


}

/**
 * Scales the font size of a title based on its length
 * @param {*} text 
 * @param {*} max_length 
 * @param {*} base_font_size 
 * @returns 
 */
function calculate_title_font_size(text, max_length, base_font_size) {

    if (text.length > max_length) {
        return `${base_font_size - (text.length - max_length) * 0.5}px`;
    }
    return `${base_font_size}px`;
}

export default {
    platform_to_svg_name,
    calculate_title_font_size
}