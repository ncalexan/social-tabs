function buildDeviceInfo() {
    var s = require("sdk/system");
    var file = require("sdk/io/file");
    var info = {
        user: s.env.USER || s.env.USERNAME,
        app: s.name,
        host: require("./hostname").hostname,
        profileName: require("./profilename").profileName,
        profileDir: file.basename(s.pathFor("ProfD"))
    };
    info.profileID = (info.host+"-"+info.profileDir).replace(/[\.\$\[\]\#\/]/g, "");
    return info;
}

exports.deviceInfo = buildDeviceInfo();
