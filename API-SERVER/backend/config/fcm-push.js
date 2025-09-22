// var FCM = require("fcm-push");
// var fcm = new FCM(
//   "AAAA8uxbopM:APA91bFF8t6ItmNKC6QD9FlWgWKpKLYHFA5tpwiq3MxbcpmMMx14PnFTDDzhlxmbzzdniLTya6k6El_bvnGftpZ3Q3dDpA_g2EEpfnb_VF2uMeqlhvLESrKNdvhWgpb9Wm14GvsPngZy"
// );
// var fcm_alive = new FCM(
//   "AAAAL7j0cUU:APA91bFP9vzJtREBNeeXN52BC7jEn8G3SBG2NiIpyd97nsIO9vpfSk7xWb0XoatY5k_5rx8Ei4D0lVGsqvUuYQVyD1d7Rdi-tJawD3mU3KzGVdgMCCJ117Lt-EeAA5Bgvtro1ZwSWWbi"
// );

// exports.sendPush = (DeviceToken, collapse_key = 'AOC_V2', data, title, body, sound = '', notification_type, color = '#FFFFFF') => {
//     if(DeviceToken == '' || DeviceToken == undefined) return;
//     switch (collapse_key) {
//         case "AOC_V2":
//             var message = {
//                 to: DeviceToken,
//                 collapse_key: collapse_key,
//                 notification: {
//                     title: title,
//                     body: body,
//                     sound: sound
//                 },
//                 data: {
//                     title: title,
//                     body: body,
//                     color: color,
//                     notification_type:notification_type,
//                     content: JSON.stringify(data)
//                 },
//             };

//             fcm.send(message)
//                 .then(function (response) {
//                     // console.log("Successfully sent with response: ", message, response);
//                     return true;
//                 })
//                 .catch(function (err) {
//                     // console.log("Something has gone wrong!", DeviceToken);
//                     // console.error(err, DeviceToken);
//                     return false;
//                 })
//             break;

//         case "ALIVE_V2":
//             var message = {
//                 to: DeviceToken,
//                 collapse_key: collapse_key,
//                 notification: {
//                     title: title,
//                     body: body,
//                 },
//                 data: {
//                     data: data,
//                 }
//             };

//             fcm_alive.send(message)
//             .then(function (response) {
//                 // console.log("Successfully sent with response: ", message, response);
//             })
//             .catch(function (err) {
//                 // console.log("Something has gone wrong!");
//                 // console.error(err, DeviceToken);
//             })
//             break;
//         default:
//             break;
//     }
// }

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(require("./aoc_v2-1.json")),
});

exports.sendPush = async (
  DeviceToken,
  collapse_key = "AOC_V2",
  data,
  title,
  body,
  sound = "",
  notification_type,
  color = "#FFFFFF"
) => {
  if (!DeviceToken) return;

  // console.log("87 sendPush");

  try {
    let message;
    
    if (!color.includes("#")) {
      color = "#" + color;
    }

    if (collapse_key === "AOC_V2") {
      message = {
        token: DeviceToken,
        android: {
          collapseKey: collapse_key,
          notification: {
            title: title,
            body: body,
            color: color,
            sound: sound || "default",
          },
        },
        data: {
          title: title,
          body: body,
          color: color,
          notification_type: notification_type,
          content: JSON.stringify(data),
        },
      };
    } else if (collapse_key === "ALIVE_V2") {
      message = {
        token: DeviceToken,
        android: {
          collapseKey: collapse_key,
          notification: {
            title: title,
            body: body,
          },
        },
        data: {
          data: JSON.stringify(data),
        },
      };
    }
    
    console.log("message",message)

    const response = await admin.messaging().send(message);
    console.log("Successfully sent with response:", response);
    return true;
  } catch (err) {
    console.error("Error sending message:", err);
    return false;
  }
};

exports.sendPushNotification = async (req, res) => {
  const { deviceToken, data, title, body, sound, notificationType, color } =
    req.body;

  try {
    const response = await this.sendPush(
      deviceToken,
      "AOC_V2",
      data,
      title,
      body,
      sound,
      notificationType,
      color
    );

    if (response) {
      return res.status(200).json({
        success: true,
        message: "Notification sent successfully",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error in sending notification",
    });
  } catch (error) {
    console.error("Error in sending push notification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
