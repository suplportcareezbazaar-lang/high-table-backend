const logos = {
    cricket: "/assets/logos/cricket.png",
    football: "/assets/logos/football.png",
    basketball: "/assets/logos/basketball.png",
    mma: "/assets/logos/mma.png",

    // leagues (optional)
    IPL: "/assets/logos/ipl.png",
    EPL: "/assets/logos/epl.png"
};

function getLogo(key) {
    if (!key) return "/assets/logos/default.png";
    return logos[key] || "/assets/logos/default.png";
}

module.exports = { getLogo };
