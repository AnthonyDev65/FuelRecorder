import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suministrosService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const suministroSchema = z.object({
  ficha: z.string().min(1, 'Ficha del vehículo es requerida'),
  kilometraje: z.coerce.number().min(1, 'Kilometraje debe ser mayor a 0'),
  galones: z.coerce.number().min(0.01, 'Galones debe ser mayor a 0'),
  lectura_dispensador: z.coerce.number().min(0, 'Lectura del dispensador es requerida'),
  fecha: z.string().optional(),
});

const NuevoSuministro = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(suministroSchema),
    defaultValues: {
      ficha: '',
      fecha: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await suministrosService.create(data);
      
      if (response.success) {
        setSuccess('✓ Suministro registrado exitosamente');
        reset({
          ficha: '',
          kilometraje: '',
          galones: '',
          lectura_dispensador: '',
          fecha: new Date().toISOString().split('T')[0],
        });
        
        // Navigate after short delay
        setTimeout(() => {
          navigate('/historial');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el suministro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Registro de Suministro</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Ficha del Vehículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ficha del Vehículo
            </label>
            <input
              {...register('ficha')}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ej: VEH-001"
            />
            {errors.ficha && (
              <p className="mt-1 text-sm text-red-600">{errors.ficha.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Ingrese la ficha del vehículo que está usando</p>
          </div>

          {/* Kilometraje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kilometraje
            </label>
            <input
              {...register('kilometraje')}
              type="number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ej: 50000"
            />
            {errors.kilometraje && (
              <p className="mt-1 text-sm text-red-600">{errors.kilometraje.message}</p>
            )}
          </div>

          {/* Galones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Galones
            </label>
            <input
              {...register('galones')}
              type="number"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ej: 15.5"
            />
            {errors.galones && (
              <p className="mt-1 text-sm text-red-600">{errors.galones.message}</p>
            )}
          </div>

          {/* Lectura del Dispensador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lectura del Dispensador
            </label>
            <input
              {...register('lectura_dispensador')}
              type="number"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ej: 1234.56"
            />
            {errors.lectura_dispensador && (
              <p className="mt-1 text-sm text-red-600">{errors.lectura_dispensador.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              {...register('fecha')}
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {errors.fecha && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Fecha actual por defecto (opcional modificar)</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registrando...
              </span>
            ) : (
              'Registrar Suministro'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NuevoSuministro;
