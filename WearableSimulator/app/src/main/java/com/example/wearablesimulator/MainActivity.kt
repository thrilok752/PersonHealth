package com.example.wearablesimulator

import android.Manifest
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.pm.PackageManager
import android.os.*
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import java.util.*
import kotlin.concurrent.fixedRateTimer
import java.nio.ByteBuffer
import java.nio.ByteOrder


class MainActivity : AppCompatActivity() {

    private lateinit var heartRateValue: TextView
    private lateinit var stepsValue: TextView
    private lateinit var sleepValue: TextView
    private lateinit var moodValue: TextView

    private lateinit var bluetoothManager: BluetoothManager
    private lateinit var advertiser: BluetoothLeAdvertiser
    private var gattServer: BluetoothGattServer? = null
    private var connectedDevice: BluetoothDevice? = null

    private val SERVICE_UUID = UUID.fromString("00001810-0000-1000-8000-00805f9b34fb")
    private val HEART_UUID = UUID.fromString("00002a37-0000-1000-8000-00805f9b34fb")
    private val STEPS_UUID = UUID.fromString("00002a78-0000-1000-8000-00805f9b34fb")
    private val SLEEP_UUID = UUID.fromString("00002a7a-0000-1000-8000-00805f9b34fb")

    private lateinit var heartCharacteristic: BluetoothGattCharacteristic
    private lateinit var stepsCharacteristic: BluetoothGattCharacteristic
    private lateinit var sleepCharacteristic: BluetoothGattCharacteristic

    private var mood = "Neutral"
    private var isSleeping = false
    private var speedMultiplier = 1
    private var stepCount = 0
    private var sleepSeconds = 0

    private var heartRateTimer: Timer? = null
    private var stepTimer: Timer? = null
    private var sleepTimer: Timer? = null


    private val permissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { startBluetooth() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        heartRateValue = findViewById(R.id.heartRateValue)
        stepsValue = findViewById(R.id.stepsValue)
        sleepValue = findViewById(R.id.sleepValue)
        moodValue = findViewById(R.id.moodValue)

        findViewById<Button>(R.id.happyButton).setOnClickListener { mood = "Happy"; moodValue.text = "Mood: 😊 Happy" }
        findViewById<Button>(R.id.angryButton).setOnClickListener { mood = "Angry"; moodValue.text = "Mood: 😠 Angry" }
        findViewById<Button>(R.id.neutralButton).setOnClickListener { mood = "Neutral"; moodValue.text = "Mood: 😐 Neutral" }

        findViewById<Button>(R.id.walkButton).setOnClickListener { startSteps(1) }
        findViewById<Button>(R.id.runButton).setOnClickListener { startSteps(2) }
        findViewById<Button>(R.id.pauseButton).setOnClickListener { stopSteps() }

        findViewById<Button>(R.id.speed1xButton).setOnClickListener { speedMultiplier = 1; Toast.makeText(this, "Speed: 1x", Toast.LENGTH_SHORT).show() }
        findViewById<Button>(R.id.speed2xButton).setOnClickListener { speedMultiplier = 2; Toast.makeText(this, "Speed: 2x", Toast.LENGTH_SHORT).show() }

        findViewById<Button>(R.id.startSleep).setOnClickListener { startSleep() }
        findViewById<Button>(R.id.endSleep).setOnClickListener { stopSleep() }
        findViewById<Button>(R.id.plus3hrSleep).setOnClickListener {
            sleepSeconds += 3 * 3600  // Adds 3 hours
            updateSleepUI()
        }



        findViewById<Button>(R.id.resetSteps).setOnClickListener { stepCount = 0; updateStepUI() }
        findViewById<Button>(R.id.resetSleep).setOnClickListener { sleepSeconds = 0; updateSleepUI() }

        bluetoothManager = getSystemService(BLUETOOTH_SERVICE) as BluetoothManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissionRequest.launch(arrayOf(
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT
            ))
        } else {
            startBluetooth()
        }
        updateStepUI()
        updateSleepUI()
}

    private fun startBluetooth() {
        advertiser = bluetoothManager.adapter.bluetoothLeAdvertiser
        gattServer = bluetoothManager.openGattServer(this, gattCallback)

        val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)

        heartCharacteristic = BluetoothGattCharacteristic(
            HEART_UUID, BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        stepsCharacteristic = BluetoothGattCharacteristic(
            STEPS_UUID, BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        sleepCharacteristic = BluetoothGattCharacteristic(
            SLEEP_UUID, BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )

        service.addCharacteristic(heartCharacteristic)
        service.addCharacteristic(stepsCharacteristic)
        service.addCharacteristic(sleepCharacteristic)
        gattServer?.addService(service)

        advertiser.startAdvertising(
            AdvertiseSettings.Builder().setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY).setConnectable(true).build(),
            AdvertiseData.Builder().setIncludeDeviceName(true).addServiceUuid(ParcelUuid(SERVICE_UUID)).build(),
            advertiseCallback
        )

        startHeartRateSimulation()
    }

    private fun startHeartRateSimulation() {
        heartRateTimer?.cancel()
        heartRateTimer = fixedRateTimer("heartRateTimer", false, 0L, 2000L) {
            val base = when (mood) {
                "Happy" -> 75
                "Angry" -> 90
                else -> 70
            }
            val activityBoost = if (stepTimer != null) 10 else 0
            val bpm = base + activityBoost + (0..5).random()
            updateCharacteristic(heartCharacteristic, bpm)
            runOnUiThread { heartRateValue.text = "Heart Rate: $bpm BPM" }
        }
    }

    private fun startSteps(mode: Int) {
        stepTimer?.cancel()
        val delay = 2000L / speedMultiplier / mode
        stepTimer = fixedRateTimer("stepTimer", false, 0L, delay) {
            stepCount += 1
            updateCharacteristic(stepsCharacteristic, stepCount)
            runOnUiThread { stepsValue.text = "Steps: $stepCount" }
        }
    }

    private fun stopSteps() {
        stepTimer?.cancel()
    }

    private fun startSleep() {
        if (isSleeping) return
        isSleeping = true
        sleepTimer?.cancel()
        sleepTimer = fixedRateTimer("sleepTimer", false, 0L, 1000L) {
            sleepSeconds += 1
            val hours = sleepSeconds / 3600
            val minutes = (sleepSeconds % 3600) / 60
            val seconds = sleepSeconds % 60
            updateCharacteristic(sleepCharacteristic, sleepSeconds / 60) // Minutes instead of hours

            runOnUiThread {
                sleepValue.text = "Sleep: ${hours}h ${minutes}m ${seconds}s"
            }
        }
    }

    private fun stopSleep() {
        if (!isSleeping) return
        isSleeping = false
        sleepTimer?.cancel()
        Toast.makeText(this, "Sleep session ended", Toast.LENGTH_SHORT).show()
    }
    private fun updateStepUI() {
        stepsValue.text = "Steps: $stepCount"
        if (::stepsCharacteristic.isInitialized) {
            updateCharacteristic(stepsCharacteristic, stepCount)
        }
    }

    private fun updateSleepUI() {
        val hours = sleepSeconds / 3600
        val minutes = (sleepSeconds % 3600) / 60
        val seconds = sleepSeconds % 60
        sleepValue.text = "Sleep: ${hours}h ${minutes}m ${seconds}s"
        if (::sleepCharacteristic.isInitialized) {
            updateCharacteristic(sleepCharacteristic, sleepSeconds / 60) // Minutes instead of hours

        }
    }


    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            super.onStartSuccess(settingsInEffect)
            Toast.makeText(this@MainActivity, "🔵 BLE Advertiser Started", Toast.LENGTH_SHORT).show()
        }

        override fun onStartFailure(errorCode: Int) {
            Toast.makeText(this@MainActivity, "❌ BLE Advertise failed: $errorCode", Toast.LENGTH_LONG).show()
        }
    }

    private val gattCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                connectedDevice = device
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "✅ Device connected", Toast.LENGTH_SHORT).show()
                }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                connectedDevice = null
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "❌ Device disconnected", Toast.LENGTH_SHORT).show()
                }
            }
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice?, requestId: Int, offset: Int,
            characteristic: BluetoothGattCharacteristic?
        ) {
            characteristic?.let {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, it.value)
            }
        }
    }

    private fun updateCharacteristic(characteristic: BluetoothGattCharacteristic, value: Int) {
        val byteArray = ByteBuffer.allocate(2)
            .order(ByteOrder.LITTLE_ENDIAN)
            .putShort(value.toShort())
            .array()
        characteristic.value = byteArray
        connectedDevice?.let {
            gattServer?.notifyCharacteristicChanged(it, characteristic, false)
        }
    }



    override fun onDestroy() {
        heartRateTimer?.cancel()
        stepTimer?.cancel()
        sleepTimer?.cancel()
        gattServer?.close()
        advertiser.stopAdvertising(advertiseCallback)
        super.onDestroy()
    }
}
