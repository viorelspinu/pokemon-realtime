package com.vsp.pvpcounters;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private Controller controller;
    private Model model;

    public MainActivity() {
        this.model = new Model();
        this.controller = new Controller(this);
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);
        this.controller.setCorrectPermissions();

        String clientId = this.model.getClientId(this);

        EditText clientIdText = (EditText) findViewById(R.id.editText3);
        clientIdText.setText(clientId);
        clientIdText.addTextChangedListener(new TextWatcher() {
            public void afterTextChanged(Editable s) {
                findViewById(R.id.start_button).setEnabled(s.length() > 0);
            }

            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }
        });


    }

    public void startService(View view) {
        String clientId = ((EditText) findViewById(R.id.editText3)).getText().toString();
        this.controller.startWatchScreenshotService(clientId);
    }

    public void stopService(View view) {
        this.controller.stopWatchScreenshotService();
    }


}