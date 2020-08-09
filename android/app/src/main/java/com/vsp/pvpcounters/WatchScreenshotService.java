package com.vsp.pvpcounters;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.database.ContentObserver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.provider.MediaStore;
import android.util.Log;
import android.widget.SimpleAdapter;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

public class WatchScreenshotService extends Service {
    public static final String CHANNEL_ID = "ForegroundServiceChannel";

    private ContentObserver contentObserver;

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String clientId = intent.getStringExtra("CLIENT_ID");
        this.unregisterContentObserver();

        createNotificationChannel();
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this,
                0, notificationIntent, 0);
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("PVPCounters")
                .setContentText("Active: " + clientId)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentIntent(pendingIntent)
                .build();
        startForeground(1, notification);

        Log.d("TAG", "onHandleIntent");

        contentObserver = new ContentObserver(new Handler()) {
            @Override
            public void onChange(boolean selfChange) {
                Log.d("TAG", "External Media has been changed");
                super.onChange(selfChange);
                Uri uri = getURI(getApplicationContext(), MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
                Controller.getController().onScreenshotDetected(getApplicationContext(), uri);
            }
        };

        getContentResolver().registerContentObserver(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true, contentObserver);

        return START_REDELIVER_INTENT;
    }

    private Uri getURI(Context context, Uri uri) {
        Cursor cursor = context.getContentResolver().query(uri, null, null, null, "date_added DESC");

        Uri imageUri = null;
        if (cursor.moveToNext()) {
            imageUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cursor.getInt(cursor.getColumnIndex(MediaStore.Images.ImageColumns._ID)));

        }
        cursor.close();
        return imageUri;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        this.unregisterContentObserver();
    }

    private void unregisterContentObserver() {
        if (this.contentObserver == null) {
            return;
        }
        getContentResolver().unregisterContentObserver(contentObserver);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Foreground Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }
}