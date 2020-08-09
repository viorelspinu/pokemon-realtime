package com.vsp.pvpcounters;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;


public class Controller {
    private static final int REQUEST_READ_STORAGE = 1;
    private static final int REQUEST_FOREGROUND_SERVICE = 2;
    private static final int REQUEST_INTERNET = 3;

    private OCRDetector ocrDetector;
    private Activity mainActivity;

    private static Controller controller;

    public Controller(MainActivity mainActivity) {
        this.ocrDetector = new OCRDetector();
        this.mainActivity = mainActivity;
        Controller.controller = this;
    }

    public static Controller getController() {
        return controller;
    }

    public void onScreenshotDetected(Context context, Uri uri) {
        ocrDetector.analyze(context, uri);
    }


    public void setCorrectPermissions() {
        setCorrectPermission(Manifest.permission.READ_EXTERNAL_STORAGE, REQUEST_READ_STORAGE);
        setCorrectPermission(Manifest.permission.FOREGROUND_SERVICE, REQUEST_FOREGROUND_SERVICE);
        setCorrectPermission(Manifest.permission.INTERNET, REQUEST_INTERNET);

    }

    public void startWatchScreenshotService(String clientId) {
        Intent serviceIntent = new Intent(mainActivity, WatchScreenshotService.class);
        serviceIntent.putExtra("CLIENT_ID", clientId);
        ContextCompat.startForegroundService(mainActivity, serviceIntent);

        Model.getModel().saveClientId(mainActivity, clientId);
    }

    private void setCorrectPermission(String permission, int requestCode) {
        boolean hasPermission = (ContextCompat.checkSelfPermission(mainActivity, permission) == PackageManager.PERMISSION_GRANTED);
        if (!hasPermission) {
            ActivityCompat.requestPermissions(mainActivity, new String[]{permission}, requestCode);
        }
    }

    public void stopWatchScreenshotService() {
        Intent serviceIntent = new Intent(mainActivity, WatchScreenshotService.class);
        mainActivity.stopService(serviceIntent);
    }

    public void doGetTask(String text) {
        new DoHttpGetTask().execute(text, Model.getModel().getClientId(mainActivity));
    }
}
