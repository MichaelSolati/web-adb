import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";

export const credentialStore = new AdbWebCredentialStore("WebADB-Screen");

export async function connectDevice() {
  const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
  if (!manager) {
    throw new Error("WebUSB not supported in this browser");
  }

  const usbDevice = await manager.requestDevice();
  if (!usbDevice) {
    return null;
  }

  const connection = await usbDevice.connect();
  const transport = await AdbDaemonTransport.authenticate({
    serial: usbDevice.serial,
    connection,
    credentialStore,
  });

  return new Adb(transport);
}

export async function captureScreen(adb: Adb) {
  const bytes = await adb.subprocess.noneProtocol.spawnWait(["screencap", "-p"]);
  return bytes;
}

export async function sendText(adb: Adb, text: string) {
  if (!text) return;
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/ /g, "%s")
    .replace(/&/g, "\\&");
  await adb.subprocess.noneProtocol.spawnWait(["input", "text", escaped]);
}

export function nowTimestamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}
