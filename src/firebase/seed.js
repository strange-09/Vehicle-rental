import { addDoc, collection } from 'firebase/firestore';
import { db } from './config';
import { cars, bikes } from '../data/vehicles';

const VEHICLES_COLLECTION = 'vehicles';

export const seedVehicles = async () => {
  try {
    console.log('Starting to seed vehicles...');
    const vehicles = [...cars, ...bikes];
    
    for (const vehicle of vehicles) {
      // Remove the old id and add hourlyRate field
      const { id: oldId, ...vehicleWithoutId } = vehicle;
      const vehicleData = {
        ...vehicleWithoutId,
        hourlyRate: Math.round(vehicle.price / 24), // Convert daily rate to hourly
        availabilityStatus: true,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), vehicleData);
      console.log(`Added vehicle ${vehicle.name} with ID: ${docRef.id}`);
    }
    
    console.log('Successfully seeded all vehicles!');
    return true;
  } catch (error) {
    console.error('Error seeding vehicles:', error);
    throw error;
  }
}; 