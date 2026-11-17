// Desktop shell for the MailleFit web app. All logic lives in the web
// app; the shell adds native "Save as" dialogs (dialog + fs plugins).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running MailleFit");
}
