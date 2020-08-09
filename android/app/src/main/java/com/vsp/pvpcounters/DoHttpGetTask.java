package com.vsp.pvpcounters;

import android.os.AsyncTask;
import android.util.Log;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

public class DoHttpGetTask extends AsyncTask<String, Void, Void> {

    private Exception exception;

    protected Void doInBackground(String... text) {
        URL url = null;
        try {
            url = new URL("https://pvpcounters.com/set?name=" + text[0] + "&client_id=" + text[1]);
            Log.d("TAG", "calling " + url);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        HttpURLConnection urlConnection = null;
        try {
            urlConnection = (HttpURLConnection) url.openConnection();
        } catch (IOException e) {
            e.printStackTrace();
        }
        try {
            InputStream in = new BufferedInputStream(urlConnection.getInputStream());
            Log.d("TAG", String.valueOf(in.available()));
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            urlConnection.disconnect();
        }
        return null;
    }


}