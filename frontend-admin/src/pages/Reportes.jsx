import React, { useState, useEffect } from 'react';
import { reportesService } from '../services';

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [reporteActivo, setReporteActivo] = useState(null);
  const [reporteDetalle, setReporteDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [lecturaFinal, setLecturaFinal] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchReporteActivo();
    fetchReportes();
  }, [pagination.page]);

  const fetchReporteActivo = async () => {
    try {
      const response = await reportesService.getReporteActivo();
      if (response.success) {
        setReporteActivo(response.data);
      }
    } catch (err) {
      console.error('Error fetching reporte activo:', err);
    }
  };

  const fetchReportes = async () => {
    try {
      setLoading(true);
      const response = await reportesService.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        setReportes(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Error al cargar los reportes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (id) => {
    try {
      const response = await reportesService.getById(id);
      if (response.success) {
        setReporteDetalle(response.data);
      }
    } catch (err) {
      setError('Error al cargar el detalle del reporte');
    }
  };

  const handleCerrarReporte = async () => {
    if (!lecturaFinal || parseFloat(lecturaFinal) <= 0) {
      setError('Lectura final debe ser mayor a 0');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await reportesService.cerrarReporte(reporteActivo.id, parseFloat(lecturaFinal));
      
      if (response.success) {
        setSuccess('Reporte cerrado exitosamente');
        setShowCerrarModal(false);
        setLecturaFinal('');
        await fetchReporteActivo();
        await fetchReportes();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error al cerrar reporte: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading && !reporteActivo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Reporte Activo */}
      {reporteActivo && reporteActivo.estado === 'abierto' && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Reporte Activo</h2>
              <p className="text-blue-100 mb-4">
                {new Date(reporteActivo.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Lectura Inicial</p>
                  <p className="text-3xl font-bold">{parseFloat(reporteActivo.lectura_inicial).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Estado</p>
                  <p className="text-xl font-semibold">
                    <span className="bg-green-500 px-3 py-1 rounded-full text-sm">
                      {reporteActivo.estado.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCerrarModal(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition shadow-md"
            >
              Cerrar Reporte
            </button>
          </div>
        </div>
      )}

      {/* Historial de Reportes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Historial de Reportes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lectura Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lectura Final
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Suministros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Galones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportes.map((reporte) => (
                <tr key={reporte.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reporte.fecha).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {parseFloat(reporte.lectura_inicial).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reporte.lectura_final ? parseFloat(reporte.lectura_final).toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reporte.total_suministros}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {parseFloat(reporte.total_galones).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      reporte.estado === 'abierto' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {reporte.estado.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleVerDetalle(reporte.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportes.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hay reportes registrados</p>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-700">
                Página {pagination.page} de {pagination.pages}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cerrar Reporte */}
      {showCerrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cerrar Reporte Diario</h3>
            <p className="text-gray-600 mb-4">
              Ingresa la lectura final del dispensador para cerrar el reporte del día.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lectura Final del Dispensador
              </label>
              <input
                type="number"
                step="0.01"
                value={lecturaFinal}
                onChange={(e) => setLecturaFinal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1500.50"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCerrarModal(false);
                  setLecturaFinal('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCerrarReporte}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Reporte */}
      {reporteDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Reporte del {new Date(reporteDetalle.reporte.fecha).toLocaleDateString('es-ES')}
                </h3>
                <p className="text-gray-600 mt-1">
                  {reporteDetalle.suministros.length} suministros registrados
                </p>
              </div>
              <button
                onClick={() => setReporteDetalle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Resumen del Reporte */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Lectura Inicial</p>
                <p className="text-2xl font-bold text-blue-900">
                  {parseFloat(reporteDetalle.reporte.lectura_inicial).toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Lectura Final</p>
                <p className="text-2xl font-bold text-green-900">
                  {reporteDetalle.reporte.lectura_final 
                    ? parseFloat(reporteDetalle.reporte.lectura_final).toFixed(2) 
                    : '-'}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Total Suministros</p>
                <p className="text-2xl font-bold text-purple-900">
                  {reporteDetalle.reporte.total_suministros}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Total Galones</p>
                <p className="text-2xl font-bold text-orange-900">
                  {parseFloat(reporteDetalle.reporte.total_galones).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Lista de Suministros */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ficha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Km</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Galones</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lectura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MDP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteDetalle.suministros.map((suministro) => (
                    <tr key={suministro.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(suministro.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {suministro.tecnico_nombre}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {suministro.ficha}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {suministro.kilometraje.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {parseFloat(suministro.galones).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {suministro.lectura_dispensador}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {suministro.mdp !== null ? (
                          <span className={`font-semibold ${
                            Math.abs(parseFloat(suministro.mdp)) > 0.5
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {parseFloat(suministro.mdp).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
