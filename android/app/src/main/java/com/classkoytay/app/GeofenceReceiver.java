package com.classkoytay.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;

/** Woken by Android on building enter/exit — works even when the app is closed. */
public class GeofenceReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        GeofencingEvent ev = GeofencingEvent.fromIntent(intent);
        if (ev == null || ev.hasError() || ev.getTriggeringGeofences() == null) return;
        int t = ev.getGeofenceTransition();
        String type = t == Geofence.GEOFENCE_TRANSITION_ENTER ? "enter" : t == Geofence.GEOFENCE_TRANSITION_EXIT ? "exit" : null;
        if (type == null) return;
        for (Geofence g : ev.getTriggeringGeofences()) GeofenceStore.addEvent(context, g.getRequestId(), type);
    }
}
