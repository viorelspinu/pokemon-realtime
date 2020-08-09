package com.vsp.pvpcounters;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;

public class Model {
    private static Model model;

    public Model() {
        Model.model = this;
    }

    public static Model getModel() {
        return model;
    }

    public void saveClientId(Activity activity, String clientId) {
        SharedPreferences sharedPreferences = activity.getPreferences(Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString("CLIENT_ID", clientId);
        editor.commit();
    }

    public String getClientId(Activity activity) {
        SharedPreferences sharedPreferences = activity.getPreferences(Context.MODE_PRIVATE);
        String clientId = sharedPreferences.getString("CLIENT_ID", "");
        return clientId;
    }
}
