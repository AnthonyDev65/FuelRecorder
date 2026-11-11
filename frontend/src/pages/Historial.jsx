import React, { useState, useEffect } from 'react';
import { suministrosService } from '../services';

const Historial = () => {
  const [suministros, setSuministros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchSuministros();
  }, []);

  const fetchSuministros = async () => {
    try {
      setLoading(true);
      const response = await suministrosService.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (response.success) {
        setSuministros(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Error al cargar el historial');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h1 className="text-xl font-bold text-gray-900">Historial de Suministros</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded-lg">
            {error}
          </div>
        )}

        {suministros.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
            <p className="mt-1 text-sm text-gray-500">Aún no has registrado suministros</p>
          </div>
        ) : (
          <div className="divide-y">
            {suministros.map((suministro, index) => {
              // Detectar si la lectura es menor a la anterior (posible fraude)
              const lecturaAnterior = index < suministros.length - 1 ? suministros[index + 1].lectura_dispensador : null;
              const lecturaEsMenor = lecturaAnterior && parseFloat(suministro.lectura_dispensador) < parseFloat(lecturaAnterior);
              
              return (
              <div key={suministro.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Ficha: {suministro.ficha}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(suministro.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Kilometraje</p>
                        <p className="font-medium text-gray-900">
                          {suministro.kilometraje.toLocaleString()} km
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tarjeta</p>
                        <p className="font-medium text-gray-900">{suministro.tarjeta}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Galones</p>
                        <p className="font-semibold text-green-600">
                          {parseFloat(suministro.galones).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Lectura Disp.</p>
                        <p className={`font-medium ${lecturaEsMenor ? 'text-red-600' : 'text-gray-900'}`}>
                          {suministro.lectura_dispensador}
                          {lecturaEsMenor && ' ⚠️'}
                        </p>
                      </div>
                      {suministro.mdp !== null && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">MDP (Margen de Pérdida)</p>
                          <p className={`font-semibold ${
                            Math.abs(parseFloat(suministro.mdp)) > 0.5
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {parseFloat(suministro.mdp).toFixed(2)} gal
                            {Math.abs(parseFloat(suministro.mdp)) > 0.5 && ' ⚠️ Fuera de rango'}
                            {Math.abs(parseFloat(suministro.mdp)) <= 0.5 && ' ✓ Aceptable'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Página {pagination.page} de {pagination.pages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
