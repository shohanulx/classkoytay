package com.classkoytay.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Android forgets geofences after a reboot or app update — register them again. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!GeofenceStore.prefs(context).getBoolean("active", false)) return;
        GeofenceStore.addEvent(context, "_system", "boot");
        GeofenceStore.register(context);
    }
}
