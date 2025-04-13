import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from './config';

const VEHICLES_COLLECTION = 'vehicles';

// Add a new vehicle (admin only)
export const addVehicle = async (vehicleData) => {
  try {
    const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), {
      ...vehicleData,
      availabilityStatus: true,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

// Update a vehicle (admin only)
export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
    await updateDoc(vehicleRef, {
      ...vehicleData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

// Delete a vehicle (admin only)
export const deleteVehicle = async (vehicleId) => {
  try {
    await deleteDoc(doc(db, VEHICLES_COLLECTION, vehicleId));
    return true;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

// Get all vehicles
export const getAllVehicles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, VEHICLES_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

// Get available vehicles by type (car/bike)
export const getAvailableVehicles = async (type = null) => {
  try {
    let vehiclesQuery;
    
    if (type) {
      vehiclesQuery = query(
        collection(db, VEHICLES_COLLECTION),
        where('type', '==', type),
        where('availabilityStatus', '==', true)
      );
    } else {
      vehiclesQuery = query(
        collection(db, VEHICLES_COLLECTION),
        where('availabilityStatus', '==', true)
      );
    }

    const querySnapshot = await getDocs(vehiclesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    throw error;
  }
};

// Get a single vehicle by ID
export const getVehicleById = async (vehicleId) => {
  try {
    if (!vehicleId) {
      console.error('getVehicleById called with no vehicleId');
      throw new Error('Vehicle ID is required');
    }
    
    console.log('Getting vehicle document reference for ID:', vehicleId);
    const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
    console.log('Fetching vehicle document...');
    const vehicleDoc = await getDoc(vehicleRef);
    
    if (vehicleDoc.exists()) {
      const vehicleData = {
        id: vehicleDoc.id,
        ...vehicleDoc.data()
      };
      console.log('Vehicle found:', vehicleData);
      return vehicleData;
    }
    
    console.log('No vehicle found with ID:', vehicleId);
    return null;
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    throw error;
  }
};

// Update vehicle availability status
export const updateVehicleAvailability = async (vehicleId, isAvailable) => {
  try {
    const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
    await updateDoc(vehicleRef, {
      availabilityStatus: isAvailable,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating vehicle availability:', error);
    throw error;
  }
}; 