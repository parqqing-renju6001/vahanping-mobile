import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const BACKEND = 'https://parkping-wwur.onrender.com';

export default function HomeScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = async () => {
    try {
      const stored = await AsyncStorage.getItem('vehicles');
      if (stored) setVehicles(JSON.parse(stored));
    } catch (e) {
      console.log('Error loading vehicles:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const deleteVehicle = (id) => {
    Alert.alert('Remove Vehicle', 'Remove this vehicle from VahanPing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = vehicles.filter(v => v.id !== id);
          setVehicles(updated);
          await AsyncStorage.setItem('vehicles', JSON.stringify(updated));
        }
      }
    ]);
  };

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.plateContainer}>
          <Text style={styles.plateText}>{item.plate}</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{item.nickname || item.model}</Text>
          <Text style={styles.vehicleDetail}>{item.color} • {item.model}</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.qrBtn}
          onPress={() => navigation.navigate('QRCode', { vehicle: item })}
        >
          <Text style={styles.qrBtnText}>📲 QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteVehicle(item.id)}
        >
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🅿️ VahanPing</Text>
          <Text style={styles.headerSub}>Your registered vehicles</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{vehicles.length}</Text>
        </View>
      </View>

      {vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptyText}>
            Add your vehicle and get a QR sticker to place on your car.{'\n'}
            People can scan it to notify you anonymously!
          </Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.addFirstBtnText}>+ Add Your First Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => item.id}
          renderItem={renderVehicle}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.addMoreText}>+ Add Another Vehicle</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plateContainer: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  plateText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  vehicleDetail: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  activeText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  qrBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  qrBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: '#2A2A2A',
    padding: 8,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  addFirstBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addFirstBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  addMoreBtn: {
    borderWidth: 1.5,
    borderColor: '#FF6B00',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  addMoreText: {
    color: '#FF6B00',
    fontWeight: '700',
    fontSize: 15,
  },
});
