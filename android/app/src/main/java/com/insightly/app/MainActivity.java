package com.insightly.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.browser.BrowserPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BrowserPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
