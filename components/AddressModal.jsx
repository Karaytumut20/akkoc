// components/AddressModal.jsx

'use client'

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";
import FloatingLabelInput from "./ui/FloatingLabelInput";

// US States List
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'AS', name: 'American Samoa' },
  { code: 'DC', name: 'District of Columbia' }, { code: 'FM', name: 'Federated States of Micronesia' },
  { code: 'GU', name: 'Guam' }, { code: 'MP', name: 'Northern Mariana Islands' }, { code: 'PW', name: 'Palau' },
  { code: 'PR', name: 'Puerto Rico' }, { code: 'VI', name: 'Virgin Islands' }
];

const AddressModal = ({ isOpen, onClose, addressToEdit }) => {
    const { addAddress, updateAddress } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({
        full_name: '', phone_number: '', pincode: '', area: '', city: '', state: '',
    });

    useEffect(() => {
        if (addressToEdit) {
            setAddress(addressToEdit);
        } else {
            setAddress({ full_name: '', phone_number: '', pincode: '', area: '', city: '', state: '' });
        }
    }, [addressToEdit, isOpen]);

    const onChangeHandler = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        // REVISED: 'pincode' added to required fields
        if (!address.full_name || !address.phone_number || !address.pincode || !address.area || !address.city || !address.state) {
            toast.error("Please fill in all required fields.");
            setLoading(false);
            return;
        }
        if (addressToEdit) {
            await updateAddress(addressToEdit.id, address);
        } else {
            await addAddress(address);
        }
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl transform transition-all">
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-3 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {addressToEdit ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={onSubmitHandler} className="space-y-8">
                        <FloatingLabelInput id="full_name" name="full_name" label="Full Name" value={address.full_name} onChange={onChangeHandler} required />
                        <FloatingLabelInput id="phone_number" name="phone_number" label="Phone Number" value={address.phone_number} onChange={onChangeHandler} required />
                        <FloatingLabelInput as="textarea" id="area" name="area" label="Address (Street, Neighborhood, Apt No)" value={address.area} onChange={onChangeHandler} required />
                        <div className="flex gap-4">
                            <FloatingLabelInput id="city" name="city" label="City" value={address.city} onChange={onChangeHandler} required />
                            
                            {/* State Selectbox */}
                            <div className="relative w-full">
                                <select
                                    id="state"
                                    name="state"
                                    value={address.state}
                                    onChange={onChangeHandler}
                                    required
                                    className="w-full px-3 pt-4 pb-2 text-gray-900 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 peer bg-[#FFFFFF] h-[55px]"
                                >
                                    <option value="" disabled>-- Select State --</option>
                                    {US_STATES.map((state) => (
                                        <option key={state.code} value={state.code}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                                {/* Label mimicking the floating effect */}
                                <label
                                    htmlFor="state"
                                    className={`
                                        absolute left-3 top-2.5 px-1 text-sm text-gray-500
                                        transition-all duration-200 ease-in-out
                                        peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-orange-600
                                        ${address.state ? '-top-2.5 text-sm peer-focus:text-orange-600' : 'top-1/2 -translate-y-1/2 text-base text-gray-400'}
                                        pointer-events-none
                                        bg-white
                                    `}
                                >
                                    State
                                </label>
                            </div>
                            {/* End State Selectbox */}
                        </div>
                        {/* REVISED: Zip Code is now required */}
                        <FloatingLabelInput 
                            id="pincode" 
                            name="pincode" 
                            label="Zip Code" 
                            value={address.pincode} 
                            onChange={onChangeHandler} 
                            required 
                        />
                        <button type="submit" disabled={loading} className="w-full mt-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:bg-orange-400">
                            {loading ? "Saving..." : (addressToEdit ? 'Update Address' : 'Save Address')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddressModal;