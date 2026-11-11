import React, { useState, useEffect } from 'react';
import { suministrosService, tecnicosService, exportService, reportesService } from '../services';

const Suministros = () => {
  const [suministros, setSuministros] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [reporteActivo, setReporteActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [verSoloReporteActivo, setVerSoloReporteActivo] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    tecnico_id: '',
    galones_min: '',
    galones_max: '',
  });

  useEffect(() => {
    fetchTecnicos();
    fetchReporteActivo();
  }, []);

  useEffect(() => {
    fetchSuministros();
  }, [filters, verSoloReporteActivo]);

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

  const fetchTecnicos = async () => {
    try {
      const response = await tecnicosService.getAll();
      if (response.success) {
        setTecnicos(response.data);
      }
    } catch (err) {
      console.error('Error fetching tecnicos:', err);
    }
  };

  const fetchSuministros = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };
      
      // Si está activado "ver solo reporte activo", agregar filtro de fecha
      if (verSoloReporteActivo && reporteActivo) {
        params.fecha_inicio = reporteActivo.fecha;
        params.fecha_fin = reporteActivo.fecha;
      }
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await suministrosService.getAll(params);
      if (response.success) {
        setSuministros(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Error al cargar los suministros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleExport = async () => {
    try {
      const blob = await exportService.exportSuministros(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'suministros.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al exportar datos');
    }
  };

  const handleRecalculateMDPById = async (id) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await suministrosService.recalculateMDPById(id);
      
      if (response.success) {
        // No mostrar mensaje si se calculó exitosamente
        if (response.message) {
          setSuccess(response.message);
          setTimeout(() => setSuccess(''), 3000);
        }
        await fetchSuministros(); // Recargar los datos
      }
    } catch (err) {
      setError('Error al calcular MDP: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 3000);
    }
  };

  // Borra todos los suministros (para demostraciones); pide escribir BORRAR para confirmar
  const handleDeleteAll = async () => {
    const confirmacion = window.prompt(
      'Se borrarán TODOS los suministros y no se pueden recuperar.\n\nEscribe BORRAR para confirmar:'
    );
    if (confirmacion !== 'BORRAR') return;

    try {
      setError('');
      const response = await suministrosService.deleteAll();
      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => setSuccess(''), 3000);
        await fetchSuministros();
      }
    } catch (err) {
      setError('Error al borrar los suministros: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 3000);
    }
  };

  const clearFilters = () => {
    setFilters({
      fecha_inicio: '',
      fecha_fin: '',
      tecnico_id: '',
      galones_min: '',
      galones_max: '',
    });
  };

  if (loading) {
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

      {/* Reporte Activo Banner */}
      {reporteActivo && reporteActivo.estado === 'abierto' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Reporte Activo: {new Date(reporteActivo.fecha).toLocaleDateString('es-ES')}
                </p>
                <p className="text-xs text-blue-700">
                  Lectura Inicial: {parseFloat(reporteActivo.lectura_inicial).toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setVerSoloReporteActivo(!verSoloReporteActivo)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                verSoloReporteActivo
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {verSoloReporteActivo ? 'Ver Todos los Registros' : 'Ver Solo Reporte Activo'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
          <div className="space-x-2">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
            </button>
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Borrar Todos
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={filters.fecha_inicio}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              name="fecha_fin"
              value={filters.fecha_fin}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Técnico
            </label>
            <select
              name="tecnico_id"
              value={filters.tecnico_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} - {t.ficha}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Galones Mín
            </label>
            <input
              type="number"
              name="galones_min"
              value={filters.galones_min}
              onChange={handleFilterChange}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Galones Máx
            </label>
            <input
              type="number"
              name="galones_max"
              value={filters.galones_max}
              onChange={handleFilterChange}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Técnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ficha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kilometraje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarjeta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Galones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lectura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MDP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suministros.map((suministro, index) => {
                // Detectar si la lectura es menor a la anterior (posible fraude)
                const lecturaAnterior = index < suministros.length - 1 ? suministros[index + 1].lectura_dispensador : null;
                const lecturaEsMenor = lecturaAnterior && parseFloat(suministro.lectura_dispensador) < parseFloat(lecturaAnterior);
                
                return (
                <tr key={suministro.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(suministro.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {suministro.tecnico_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {suministro.ficha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {suministro.kilometraje.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {suministro.tarjeta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {parseFloat(suministro.galones).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${lecturaEsMenor ? 'text-red-600' : 'text-gray-900'}`}>
                      {suministro.lectura_dispensador}
                      {lecturaEsMenor && ' ⚠️'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleRecalculateMDPById(suministro.id)}
                      className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                      title="Calcular MDP"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {suministros.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hay registros de suministros</p>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}de{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suministros;
