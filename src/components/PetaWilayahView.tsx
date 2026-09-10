import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Map,
  MapPin,
  Layers,
  Compass,
  Navigation,
  Shield,
  ShieldCheck,
  Camera,
  Building,
  Moon,
  HeartPulse,
  Activity,
  ShoppingBag,
  Utensils,
  Sparkles,
  Printer,
  ExternalLink,
  Search,
  Check,
  Phone,
  MessageCircle,
  Users,
  CreditCard,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ChevronRight,
  Info,
  Globe,
  Landmark,
  Radio,
  Share2,
  FileDown,
  Eye,
  Sliders,
  Triangle,
  Square,
  AlertTriangle,
  Lightbulb,
  Truck,
  Trash2,
  TrendingUp,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  FileText,
  Plus,
  Edit,
  Edit3,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Move,
  Target,
  Crosshair,
  MousePointer,
  SlidersHorizontal,
  RefreshCw,
  Store,
  Trees,
  Home
} from 'lucide-react';
import { RWProfile, AppUser } from '../types';
import {
  RW018_SPATIAL_PROFILE,
  RT_BOUNDARIES_DATA,
  POI_LIST_DATA,
  PetaPointOfInterest,
  RtBoundaryData,
  DATA_INFRASTRUKTUR_JALAN,
  DATA_DRAINASE,
  DATA_PJU,
  DATA_TITIK_RUMAH,
  DATA_PROGRAM_PEMBANGUNAN,
  DATA_CUPLIKAN_REKAMAN_CCTV,
  CctvRecordingClip,
  TitikRumahWarga,
  InfrastrukturJalan,
  DrainaseData,
  PjuData,
  ProgramPembangunan,
  CustomPetaMarker,
  SimbolBentukType,
  getStoredCustomMarkers,
  saveStoredCustomMarker,
  updateStoredCustomMarkerPosition,
  deleteStoredCustomMarker,
  resetStoredCustomMarkers,
  getStoredPois,
  saveStoredPoi,
  deleteStoredPoi,
  getStoredJalan,
  saveStoredJalan,
  deleteStoredJalan,
  getStoredPju,
  saveStoredPju,
  deleteStoredPju,
  getStoredDrainase,
  saveStoredDrainase,
  deleteStoredDrainase,
  getStoredCuplikan,
  resetStoredCuplikan
} from '../data/petaData';
import { LOGO_RW_018, handleLogoError, getRtLogo } from '../constants/logo';
import { CctvFormModal } from './peta/CctvFormModal';
import { CctvLivePlayerModal } from './peta/CctvLivePlayerModal';
import { JalanFormModal } from './peta/JalanFormModal';
import { PjuFormModal } from './peta/PjuFormModal';
import { DrainaseFormModal } from './peta/DrainaseFormModal';
import { CustomMarkerModal } from './peta/CustomMarkerModal';
import { ManageMarkersModal } from './peta/ManageMarkersModal';
import { Film, Clock, Video } from 'lucide-react';

interface PetaWilayahViewProps {
  profile: RWProfile;
  currentUser?: AppUser | null;
  onNavigateToTab?: (tab: any) => void;
  onOpenLetterPrintModal?: () => void;
}

export const PetaWilayahView: React.FC<PetaWilayahViewProps> = ({
  profile,
  currentUser,
  onNavigateToTab
}) => {
  // Dynamic State for POIs, CCTV, Jalan, PJU, Drainase with Persistence
  const [pois, setPois] = useState<PetaPointOfInterest[]>(() => getStoredPois());
  const [jalanList, setJalanList] = useState<InfrastrukturJalan[]>(() => getStoredJalan());
  const [pjuList, setPjuList] = useState<PjuData[]>(() => getStoredPju());
  const [drainaseList, setDrainaseList] = useState<DrainaseData[]>(() => getStoredDrainase());

  // Dynamic State for Custom Placed Map Symbols / Markers
  const [customMarkers, setCustomMarkers] = useState<CustomPetaMarker[]>(() => getStoredCustomMarkers());
  const [isCustomMarkerModalOpen, setIsCustomMarkerModalOpen] = useState(false);
  const [isManageMarkersModalOpen, setIsManageMarkersModalOpen] = useState(false);
  const [editingCustomMarker, setEditingCustomMarker] = useState<CustomPetaMarker | null>(null);
  const [markerPlacementMode, setMarkerPlacementMode] = useState(false);
  const [draftMarkerData, setDraftMarkerData] = useState<Partial<CustomPetaMarker> | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [dragCoord, setDragCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const activeDraggingIdRef = useRef<string | null>(null);
  const dragCoordRef = useRef<{ x: number; y: number }>({ x: 500, y: 440 });
  const rafRef = useRef<number | null>(null);
  const [selectedCustomMarker, setSelectedCustomMarker] = useState<CustomPetaMarker | null>(null);
  const [showCustomMarkers, setShowCustomMarkers] = useState<boolean>(true);
  const [mapNotification, setMapNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [initialMarkerPos, setInitialMarkerPos] = useState<{ x: number; y: number } | null>(null);

  // Reference to SVG element for coordinate transformations
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Modal States
  const [isCctvModalOpen, setIsCctvModalOpen] = useState(false);
  const [editingCctv, setEditingCctv] = useState<PetaPointOfInterest | null>(null);
  const [isLivePlayerOpen, setIsLivePlayerOpen] = useState(false);
  const [selectedLiveCctv, setSelectedLiveCctv] = useState<PetaPointOfInterest | null>(null);
  const [cctvRtFilter, setCctvRtFilter] = useState<string>('ALL');
  const [cctvSearchQuery, setCctvSearchQuery] = useState<string>('');
  const [cctvAutoPlayAll, setCctvAutoPlayAll] = useState<boolean>(true);
  const [cctvSubTab, setCctvSubTab] = useState<'live' | 'cuplikan'>('live');
  const [cuplikanCategoryFilter, setCuplikanCategoryFilter] = useState<string>('ALL');
  const [cuplikanList, setCuplikanList] = useState<CctvRecordingClip[]>(() => getStoredCuplikan());
  const [livePlayerInitialMode, setLivePlayerInitialMode] = useState<'live' | 'cuplikan'>('live');
  const [livePlayerInitialCategory, setLivePlayerInitialCategory] = useState<'ALL' | 'jalan_kampung' | 'perempatan' | 'gang' | 'pos_kamling' | 'depan_sd_fasum'>('ALL');

  const [isJalanModalOpen, setIsJalanModalOpen] = useState(false);
  const [editingJalan, setEditingJalan] = useState<InfrastrukturJalan | null>(null);

  const [isPjuModalOpen, setIsPjuModalOpen] = useState(false);
  const [editingPju, setEditingPju] = useState<PjuData | null>(null);

  const [isDrainaseModalOpen, setIsDrainaseModalOpen] = useState(false);
  const [editingDrainase, setEditingDrainase] = useState<DrainaseData | null>(null);

  // Filter States
  const [selectedRtFilter, setSelectedRtFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [activeLayer, setActiveLayer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Access Level: 'public' | 'pengurus' | 'admin'
  const [accessLevel, setAccessLevel] = useState<'public' | 'pengurus' | 'admin'>('public');

  // Map Appearance Mode: 'satellite_doc' | 'vector_clean' | 'hybrid'
  const [mapStyle, setMapStyle] = useState<'satellite_doc' | 'vector_clean' | 'hybrid'>('satellite_doc');
  const [showSatelliteBg, setShowSatelliteBg] = useState<boolean>(true);
  const [satelliteOpacity, setSatelliteOpacity] = useState<number>(0.92);

  // View Mode: 'spatial' (Interactive SVG), 'google' (Google Maps Satellite / Live), 'cctv_matrix' (CCTV Grid)
  const [viewMode, setViewMode] = useState<'spatial' | 'google' | 'cctv_matrix'>('spatial');
  
  // Interactive Selection
  const [selectedPoi, setSelectedPoi] = useState<PetaPointOfInterest | null>(null);
  const [selectedRtData, setSelectedRtData] = useState<RtBoundaryData | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<TitikRumahWarga | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [activeRtTab, setActiveRtTab] = useState<'ringkasan' | 'warga' | 'rumah' | 'infrastruktur' | 'bansos' | 'keamanan'>('ringkasan');

  // CCTV Handlers
  const handleOpenAddCctv = () => {
    setEditingCctv(null);
    setIsCctvModalOpen(true);
  };

  const handleOpenEditCctv = (poi: PetaPointOfInterest) => {
    setEditingCctv(poi);
    setIsCctvModalOpen(true);
  };

  const handleSaveCctv = (item: PetaPointOfInterest) => {
    const updated = saveStoredPoi(item);
    setPois(updated);
  };

  const handleDeleteCctv = (id: string) => {
    const updated = deleteStoredPoi(id);
    setPois(updated);
    if (selectedPoi?.id === id) setSelectedPoi(null);
  };

  // Jalan Handlers
  const handleOpenAddJalan = () => {
    setEditingJalan(null);
    setIsJalanModalOpen(true);
  };

  const handleOpenEditJalan = (jalan: InfrastrukturJalan) => {
    setEditingJalan(jalan);
    setIsJalanModalOpen(true);
  };

  const handleSaveJalan = (item: InfrastrukturJalan) => {
    const updated = saveStoredJalan(item);
    setJalanList(updated);
  };

  const handleDeleteJalan = (id: string) => {
    const updated = deleteStoredJalan(id);
    setJalanList(updated);
  };

  // PJU Handlers
  const handleOpenAddPju = () => {
    setEditingPju(null);
    setIsPjuModalOpen(true);
  };

  const handleOpenEditPju = (pju: PjuData) => {
    setEditingPju(pju);
    setIsPjuModalOpen(true);
  };

  const handleSavePju = (item: PjuData) => {
    const updated = saveStoredPju(item);
    setPjuList(updated);
  };

  const handleDeletePju = (id: string) => {
    const updated = deleteStoredPju(id);
    setPjuList(updated);
  };

  // Drainase Handlers
  const handleOpenAddDrainase = () => {
    setEditingDrainase(null);
    setIsDrainaseModalOpen(true);
  };

  const handleOpenEditDrainase = (drainase: DrainaseData) => {
    setEditingDrainase(drainase);
    setIsDrainaseModalOpen(true);
  };

  const handleSaveDrainase = (item: DrainaseData) => {
    const updated = saveStoredDrainase(item);
    setDrainaseList(updated);
  };

  const handleDeleteDrainase = (id: string) => {
    const updated = deleteStoredDrainase(id);
    setDrainaseList(updated);
  };

  // NOTIFICATION TOAST AUTO-HIDE
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setMapNotification({ message, type });
    setTimeout(() => {
      setMapNotification(null);
    }, 4500);
  };

  // SVG COORDINATES CALCULATION (Exact inverse matrix mapping with aspect ratio fallback & grid snap)
  const getSvgCoordinates = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement> | MouseEvent | TouchEvent | PointerEvent | React.PointerEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 500, y: 440 };
    const svg = svgRef.current;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
      clientX = (e as TouchEvent).touches[0].clientX;
      clientY = (e as TouchEvent).touches[0].clientY;
    } else if ('changedTouches' in e && (e as TouchEvent).changedTouches && (e as TouchEvent).changedTouches.length > 0) {
      clientX = (e as TouchEvent).changedTouches[0].clientX;
      clientY = (e as TouchEvent).changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      return { x: 500, y: 440 };
    }

    let calculatedX = 500;
    let calculatedY = 440;

    const screenCTM = svg.getScreenCTM();
    if (screenCTM) {
      try {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgPoint = pt.matrixTransform(screenCTM.inverse());
        calculatedX = svgPoint.x;
        calculatedY = svgPoint.y;
      } catch {
        // Fallback below if matrix inversion fails
      }
    } else {
      const rect = svg.getBoundingClientRect();
      const svgRatio = 1000 / 880;
      const containerRatio = rect.width / rect.height;
      let renderWidth = rect.width;
      let renderHeight = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (containerRatio > svgRatio) {
        renderWidth = rect.height * svgRatio;
        offsetX = (rect.width - renderWidth) / 2;
      } else {
        renderHeight = rect.width / svgRatio;
        offsetY = (rect.height - renderHeight) / 2;
      }

      calculatedX = ((clientX - (rect.left + offsetX)) / renderWidth) * 1000;
      calculatedY = ((clientY - (rect.top + offsetY)) / renderHeight) * 880;
    }

    if (snapToGrid) {
      calculatedX = Math.round(calculatedX / 10) * 10;
      calculatedY = Math.round(calculatedY / 10) * 10;
    } else {
      calculatedX = Math.round(calculatedX);
      calculatedY = Math.round(calculatedY);
    }

    return {
      x: Math.max(15, Math.min(985, calculatedX)),
      y: Math.max(15, Math.min(865, calculatedY))
    };
  }, [snapToGrid]);

  // GLOBAL WINDOW EVENT LISTENERS FOR LAG-FREE, PRECISE DRAGGING
  // Keeps mouse pointer and marker movement focused and 100% synchronized
  useEffect(() => {
    if (!draggingMarkerId) return;

    const handleWindowPointerMove = (e: MouseEvent | TouchEvent) => {
      const coords = getSvgCoordinates(e);
      dragCoordRef.current = coords;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragCoord(coords);
        setHoverCoord(coords);
      });
    };

    const handleWindowPointerUp = (e: MouseEvent | TouchEvent) => {
      const markerId = activeDraggingIdRef.current;
      const finalCoords = getSvgCoordinates(e);
      dragCoordRef.current = finalCoords;

      if (markerId) {
        const updated = updateStoredCustomMarkerPosition(markerId, finalCoords.x, finalCoords.y);
        setCustomMarkers(updated);
        const dragged = updated.find(m => m.id === markerId);
        if (dragged) setSelectedCustomMarker(dragged);
        showToast(`🎯 Simbol "${dragged?.nama || 'Tanda'}" tepat difokuskan pada koordinat (X: ${finalCoords.x}, Y: ${finalCoords.y})`, 'success');
      }

      activeDraggingIdRef.current = null;
      setDraggingMarkerId(null);
      setDragCoord(null);
    };

    window.addEventListener('mousemove', handleWindowPointerMove, { passive: true });
    window.addEventListener('mouseup', handleWindowPointerUp);
    window.addEventListener('touchmove', handleWindowPointerMove, { passive: true });
    window.addEventListener('touchend', handleWindowPointerUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowPointerMove);
      window.removeEventListener('mouseup', handleWindowPointerUp);
      window.removeEventListener('touchmove', handleWindowPointerMove);
      window.removeEventListener('touchend', handleWindowPointerUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draggingMarkerId, getSvgCoordinates]);

  // CUSTOM MARKER HANDLERS
  const handleOpenAddCustomMarker = (pos?: { x: number; y: number }) => {
    setEditingCustomMarker(null);
    setInitialMarkerPos(pos || { x: 500, y: 440 });
    setIsCustomMarkerModalOpen(true);
  };

  const handleOpenEditCustomMarker = (marker: CustomPetaMarker) => {
    setEditingCustomMarker(marker);
    setIsCustomMarkerModalOpen(true);
  };

  const handleSaveCustomMarker = (marker: CustomPetaMarker) => {
    const updated = saveStoredCustomMarker(marker);
    setCustomMarkers(updated);
    if (selectedCustomMarker?.id === marker.id) {
      setSelectedCustomMarker(marker);
    }
    showToast(`✅ Simbol tanda "${marker.nama}" berhasil disimpan pada peta satelit.`, 'success');
  };

  const handleDeleteCustomMarker = (id: string) => {
    const target = customMarkers.find(m => m.id === id);
    const updated = deleteStoredCustomMarker(id);
    setCustomMarkers(updated);
    if (selectedCustomMarker?.id === id) setSelectedCustomMarker(null);
    showToast(`🗑️ Simbol tanda "${target?.nama || ''}" telah dihapus dari peta.`, 'info');
  };

  const handleResetCustomMarkers = () => {
    const updated = resetStoredCustomMarkers();
    setCustomMarkers(updated);
    setSelectedCustomMarker(null);
    showToast('🔄 Simbol tanda telah direset ke konfigurasi standar RW 018.', 'info');
  };

  const handleStartClickToPlace = (draft: Partial<CustomPetaMarker>) => {
    setDraftMarkerData(draft);
    setMarkerPlacementMode(true);
    showToast('🎯 Mode Taruh Simbol Aktif: Gerakkan pointer mouse ke titik target di peta dan klik.', 'info');
  };

  const handleStartMoveMarker = (marker: CustomPetaMarker) => {
    setDraftMarkerData(marker);
    setMarkerPlacementMode(true);
    setHoverCoord(marker.svgPos);
    showToast(`📍 Mode Geser Aktif: Arahkan pointer mouse ke posisi baru di peta untuk memindahkan "${marker.nama}".`, 'info');
  };

  // SVG CANVAS CLICK HANDLER (for placement mode)
  const handleSvgMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (markerPlacementMode) {
      const coords = getSvgCoordinates(e);
      if (draftMarkerData?.id) {
        // Moving existing marker
        const updated = updateStoredCustomMarkerPosition(draftMarkerData.id, coords.x, coords.y);
        setCustomMarkers(updated);
        const m = updated.find(x => x.id === draftMarkerData.id);
        if (m) setSelectedCustomMarker(m);
        showToast(`🎯 Posisi tanda "${draftMarkerData.nama || 'Simbol'}" tepat dipindahkan ke (X: ${coords.x}, Y: ${coords.y}).`, 'success');
      } else {
        // Creating new marker from draft or default
        const newMarker: CustomPetaMarker = {
          id: `custom-marker-${Date.now()}`,
          nama: draftMarkerData?.nama || 'Simbol Tanda Baru',
          simbolBentuk: (draftMarkerData?.simbolBentuk as SimbolBentukType) || 'pin',
          kategoriLabel: 'Simbol Wilayah Satelit',
          rt: (draftMarkerData?.rt as any) || (selectedRtFilter !== 'ALL' ? selectedRtFilter : 'UMUM'),
          warna: draftMarkerData?.warna || '#2563eb',
          keterangan: draftMarkerData?.keterangan || '',
          penanggungJawab: draftMarkerData?.penanggungJawab,
          kontak: draftMarkerData?.kontak,
          svgPos: coords,
          createdAt: new Date().toISOString()
        };
        const updated = saveStoredCustomMarker(newMarker);
        setCustomMarkers(updated);
        setSelectedCustomMarker(newMarker);
        showToast(`🎉 Simbol tanda "${newMarker.nama}" berhasil diletakkan tepat pada (X: ${coords.x}, Y: ${coords.y}).`, 'success');
      }
      setMarkerPlacementMode(false);
      setDraftMarkerData(null);
    }
  };

  // DRAG & DROP MARKER HANDLERS WITH ABSOLUTE POINTER-SYNC
  const handleMarkerMouseDown = (e: React.MouseEvent, marker: CustomPetaMarker) => {
    e.stopPropagation();
    e.preventDefault();
    activeDraggingIdRef.current = marker.id;
    setDraggingMarkerId(marker.id);
    const coords = getSvgCoordinates(e);
    dragCoordRef.current = coords;
    setDragCoord(coords);
    setHoverCoord(coords);
  };

  const handleMarkerTouchStart = (e: React.TouchEvent, marker: CustomPetaMarker) => {
    e.stopPropagation();
    activeDraggingIdRef.current = marker.id;
    setDraggingMarkerId(marker.id);
    const coords = getSvgCoordinates(e);
    dragCoordRef.current = coords;
    setDragCoord(coords);
    setHoverCoord(coords);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSvgCoordinates(e);
    setHoverCoord(coords);
    if (draggingMarkerId) {
      dragCoordRef.current = coords;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragCoord(coords);
      });
    }
  };

  const handleSvgTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    const coords = getSvgCoordinates(e);
    setHoverCoord(coords);
    if (draggingMarkerId) {
      dragCoordRef.current = coords;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragCoord(coords);
      });
    }
  };

  const handleSvgMouseUpOrEnd = () => {
    if (draggingMarkerId && dragCoord) {
      const updated = updateStoredCustomMarkerPosition(draggingMarkerId, dragCoord.x, dragCoord.y);
      setCustomMarkers(updated);
      const dragged = updated.find(m => m.id === draggingMarkerId);
      if (dragged) setSelectedCustomMarker(dragged);
      showToast(`🎯 Simbol "${dragged?.nama || 'Tanda'}" tepat diperbarui ke (X: ${dragCoord.x}, Y: ${dragCoord.y})`, 'success');
      activeDraggingIdRef.current = null;
      setDraggingMarkerId(null);
      setDragCoord(null);
    }
  };

  // Filtered POIs
  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      // RT filter
      if (selectedRtFilter !== 'ALL' && poi.rt !== selectedRtFilter && poi.rt !== 'UMUM') {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        if (selectedCategoryFilter === 'cctv' && poi.kategori !== 'cctv') return false;
        if (selectedCategoryFilter === 'pos_ronda' && poi.kategori !== 'pos_ronda') return false;
        if (selectedCategoryFilter === 'ibadah' && poi.kategori !== 'ibadah') return false;
        if (selectedCategoryFilter === 'fasum' && poi.kategori !== 'fasum' && poi.kategori !== 'kesehatan') return false;
        if (selectedCategoryFilter === 'umkm' && poi.kategori !== 'umkm') return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = poi.nama.toLowerCase().includes(q);
        const matchAddress = poi.alamat.toLowerCase().includes(q);
        const matchPj = poi.penanggungJawab.toLowerCase().includes(q);
        const matchId = poi.cctvIpOrId?.toLowerCase().includes(q) || false;
        const matchDesc = poi.deskripsi.toLowerCase().includes(q);
        if (!matchName && !matchAddress && !matchPj && !matchId && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [pois, selectedRtFilter, selectedCategoryFilter, searchQuery]);

  // Filtered Houses
  const filteredHouses = useMemo(() => {
    return DATA_TITIK_RUMAH.filter((h) => {
      if (selectedRtFilter !== 'ALL' && h.rt !== selectedRtFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          h.namaKepalaKeluarga.toLowerCase().includes(q) ||
          h.alamat.toLowerCase().includes(q) ||
          h.noRumah.toLowerCase().includes(q) ||
          h.kategori.some(k => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedRtFilter, searchQuery]);

  // Statistics
  const cctvCount = useMemo(() => POI_LIST_DATA.filter(p => p.kategori === 'cctv').length, []);
  const posRondaCount = useMemo(() => POI_LIST_DATA.filter(p => p.kategori === 'pos_ronda').length, []);
  const ibadahCount = useMemo(() => POI_LIST_DATA.filter(p => p.kategori === 'ibadah').length, []);
  const umkmCount = useMemo(() => POI_LIST_DATA.filter(p => p.kategori === 'umkm').length, []);

  // POI Icon Renderer
  const renderPoiIcon = (iconName: string, className: string = 'w-3.5 h-3.5') => {
    switch (iconName) {
      case 'Building': return <Building className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Camera': return <Camera className={className} />;
      case 'Moon': return <Moon className={className} />;
      case 'Triangle': return <Triangle className={className} />;
      case 'HeartPulse': return <HeartPulse className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'ShoppingBag': return <ShoppingBag className={className} />;
      case 'Utensils': return <Utensils className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      default: return <MapPin className={className} />;
    }
  };

  // SVG Marker Shape Renderer for Custom Placed Symbols
  const renderSvgMarkerShape = (marker: CustomPetaMarker) => {
    const { simbolBentuk, warna } = marker;
    switch (simbolBentuk) {
      case 'pin':
        return (
          <g>
            {/* Focal Ground Shadow beneath needle point */}
            <ellipse cx="0" cy="1" rx="5" ry="2.2" fill="rgba(0,0,0,0.5)" />
            {/* Pin Body with needle tip terminating EXACTLY at (0, 0) */}
            <path
              d="M 0,0 C -2,-4 -15,-15 -15,-25 C -15,-33.5 -8.5,-40 0,-40 C 8.5,-40 15,-33.5 15,-25 C 15,-15 2,-4 0,0 Z"
              fill={warna || '#2563eb'}
              stroke="#ffffff"
              strokeWidth="2"
              filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.65))"
            />
            {/* Inner Pin Head Core */}
            <circle cx="0" cy="-25" r="5" fill="#ffffff" />
            {/* Ultra-precise Focal Needle Point Target at (0,0) */}
            <circle cx="0" cy="0" r="1.5" fill="#facc15" stroke="#000000" strokeWidth="0.6" />
          </g>
        );
      case 'kotak': // Khas Pos Kamling / Gardu Ronda Kotak Hitam
        return (
          <g>
            <rect
              x="-12"
              y="-12"
              width="24"
              height="24"
              rx="4"
              fill={warna || '#0f172a'}
              stroke="#ffffff"
              strokeWidth="2"
              filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.6))"
            />
            <circle cx="0" cy="0" r="3.5" fill="#facc15" />
          </g>
        );
      case 'segitiga': // Khas Masjid / Tempat Ibadah
        return (
          <g>
            <polygon
              points="0,-15 -14,10 14,10"
              fill={warna || '#15803d'}
              stroke="#ffffff"
              strokeWidth="2"
              filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.6))"
            />
            <circle cx="0" cy="1" r="3.5" fill="#fef08a" />
          </g>
        );
      case 'portal':
        return (
          <g>
            <rect x="-14" y="-7" width="28" height="14" rx="3" fill={warna || '#dc2626'} stroke="#ffffff" strokeWidth="2" />
            <line x1="-9" y1="-7" x2="-5" y2="7" stroke="#ffffff" strokeWidth="2" />
            <line x1="0" y1="-7" x2="4" y2="7" stroke="#ffffff" strokeWidth="2" />
            <line x1="9" y1="-7" x2="13" y2="7" stroke="#ffffff" strokeWidth="2" />
            <circle cx="0" cy="0" r="2.5" fill="#fef08a" />
          </g>
        );
      case 'kamera':
        return (
          <g>
            <rect x="-11" y="-8" width="22" height="16" rx="3" fill={warna || '#0284c7'} stroke="#ffffff" strokeWidth="2" />
            <polygon points="11,-5 16,-9 16,9 11,5" fill={warna || '#0284c7'} stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="-2" cy="0" r="4.5" fill="#082f49" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="-2" cy="0" r="2" fill="#38bdf8" />
          </g>
        );
      case 'lampu':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill={warna || '#f59e0b'} opacity="0.35" />
            <circle cx="0" cy="-2" r="8" fill={warna || '#f59e0b'} stroke="#ffffff" strokeWidth="1.8" />
            <rect x="-3" y="6" width="6" height="4" rx="1" fill="#475569" stroke="#ffffff" strokeWidth="0.8" />
            <path d="M -10,-2 L -14,-2 M 10,-2 L 14,-2 M 0,-12 L 0,-16 M -8,-10 L -11,-13 M 8,-10 L 11,-13" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        );
      case 'shield':
        return (
          <g>
            <path d="M 0,-14 L 12,-7 L 12,4 C 12,11 0,16 0,16 C 0,16 -12,11 -12,4 L -12,-7 Z" fill={warna || '#334155'} stroke="#ffffff" strokeWidth="2" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
          </g>
        );
      case 'toko':
        return (
          <g>
            <rect x="-12" y="-3" width="24" height="15" rx="2" fill={warna || '#ea580c'} stroke="#ffffff" strokeWidth="1.8" />
            <path d="M -14,-3 L -12,-12 L 12,-12 L 14,-3 Z" fill={warna || '#ea580c'} stroke="#ffffff" strokeWidth="1.5" />
            <rect x="-4" y="2" width="8" height="9" rx="1" fill="#ffffff" opacity="0.9" />
          </g>
        );
      case 'medis':
        return (
          <g>
            <circle cx="0" cy="0" r="12" fill={warna || '#db2777'} stroke="#ffffff" strokeWidth="2" />
            <rect x="-2.5" y="-8" width="5" height="16" rx="1" fill="#ffffff" />
            <rect x="-8" y="-2.5" width="16" height="5" rx="1" fill="#ffffff" />
          </g>
        );
      case 'rumah':
        return (
          <g>
            <polygon points="0,-14 -14,-1 14,-1" fill={warna || '#16a34a'} stroke="#ffffff" strokeWidth="1.8" />
            <rect x="-10" y="-1" width="20" height="14" fill={warna || '#16a34a'} stroke="#ffffff" strokeWidth="1.8" />
            <rect x="-3" y="4" width="6" height="9" fill="#ffffff" />
          </g>
        );
      case 'taman':
        return (
          <g>
            <circle cx="0" cy="-6" r="10" fill={warna || '#059669'} stroke="#ffffff" strokeWidth="1.8" />
            <rect x="-2.5" y="4" width="5" height="9" fill="#78350f" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="0" cy="-6" r="4.5" fill="#34d399" opacity="0.8" />
          </g>
        );
      case 'bintang':
        return (
          <g>
            <polygon
              points="0,-16 4.5,-5 16,-5 7,3 10.5,14 0,7.5 -10.5,14 -7,3 -16,-5 -4.5,-5"
              fill={warna || '#eab308'}
              stroke="#ffffff"
              strokeWidth="1.8"
            />
          </g>
        );
      case 'peringatan':
        return (
          <g>
            <polygon points="0,-16 -14,10 14,10" fill={warna || '#e11d48'} stroke="#ffffff" strokeWidth="2" />
            <line x1="0" y1="-8" x2="0" y2="1" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="5.5" r="1.5" fill="#ffffff" />
          </g>
        );
      default:
        return (
          <g>
            <circle cx="0" cy="0" r="11" fill={warna || '#2563eb'} stroke="#ffffff" strokeWidth="2" />
            <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
          </g>
        );
    }
  };

  const handleShareLocation = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Peta Wilayah RW 018 Kelurahan Iringmulyo',
        text: 'Peta Geografis dan Denah Wilayah RT 039, RT 040, RT 041, RT 042 RW 018 Iringmulyo, Metro Timur, Kota Metro Lampung.',
        url: RW018_SPATIAL_PROFILE.googleMapsUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(RW018_SPATIAL_PROFILE.googleMapsUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrintMap = () => {
    window.print();
  };

  // When clicking an RT
  const handleSelectRt = (rtNum: string) => {
    const found = RT_BOUNDARIES_DATA.find(r => r.rt === rtNum);
    if (found) {
      setSelectedRtFilter(rtNum);
      setSelectedRtData(found);
      setSelectedPoi(null);
      setSelectedHouse(null);
    }
  };

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4 pb-20 select-none">
      {/* 1. Header & Title Section */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner shrink-0">
              <img
                src={LOGO_RW_018}
                alt="Logo RW 018"
                onError={handleLogoError}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter drop-shadow"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] sm:text-xs font-bold tracking-wide uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Sistem Pemetaan Wilayah Terpadu RW 018
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 16 Layer GIS & Database
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                Peta Wilayah Resmi RW 018 Kampung Banten
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                Kelurahan Iringmulyo, Kecamatan Metro Timur, Kota Metro Lampung (34112)
              </p>
            </div>
          </div>

          {/* Top Level Access & Tools */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            {/* 3 Level Access Selector */}
            <div className="flex items-center bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/15 text-xs font-bold">
              <button
                onClick={() => setAccessLevel('public')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  accessLevel === 'public' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Mode Akses Warga / Publik"
              >
                <Unlock className="w-3 h-3" />
                <span>Publik</span>
              </button>
              <button
                onClick={() => setAccessLevel('pengurus')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  accessLevel === 'pengurus' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Mode Akses Pengurus RT"
              >
                <Users className="w-3 h-3" />
                <span>Pengurus RT</span>
              </button>
              <button
                onClick={() => setAccessLevel('admin')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  accessLevel === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Mode Akses Ketua RW & Admin (Full Database)"
              >
                <Lock className="w-3 h-3" />
                <span>Ketua RW / Admin</span>
              </button>
            </div>

            <button
              id="btn-print-peta"
              onClick={handlePrintMap}
              className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Cetak Denah & Peta Resmi RW 018"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              id="btn-share-loc"
              onClick={handleShareLocation}
              className="p-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all cursor-pointer"
              title="Bagikan Tautan Peta RW 018"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div className="mt-4 pt-3 border-t border-emerald-700/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-center">
          <div className="bg-white/5 backdrop-blur-xs p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Wilayah RT</span>
            <span className="text-sm sm:text-base font-black text-white">4 RT (039 - 042)</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Estimasi Luas</span>
            <span className="text-sm sm:text-base font-black text-emerald-300">± 18.5 Ha</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Total KK Terdata</span>
            <span className="text-sm sm:text-base font-black text-white">195 KK</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Total Jiwa</span>
            <span className="text-sm sm:text-base font-black text-white">723 Penduduk</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Gardu Pos Ronda</span>
            <span className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-center gap-1">
              <Square className="w-3.5 h-3.5 fill-slate-900" /> 4 Gardu (Kotak Hitam)
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Tempat Ibadah</span>
            <span className="text-sm sm:text-base font-black text-emerald-300 flex items-center justify-center gap-1">
              <Triangle className="w-3.5 h-3.5 fill-emerald-500 text-emerald-300" /> Baiturrahman & Musholla
            </span>
          </div>
        </div>
      </div>

      {/* 2. Mode Selector & Filters Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: View Modes & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => setViewMode('spatial')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'spatial'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Peta Wilayah Visual (Foto Dokumen RW)</span>
            </button>

            <button
              onClick={() => setViewMode('google')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'google'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Maps Live</span>
            </button>

            <button
              onClick={() => setViewMode('cctv_matrix')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cctv_matrix'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Titik Pantau CCTV (16)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kepala keluarga, jalan, pos ronda, Masjid Baiturrahman, CCTV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: RT Blocks & Legend Color Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* RT Filter Buttons with User Specified Colors */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Blok RT:
            </span>
            <button
              onClick={() => { setSelectedRtFilter('ALL'); setSelectedRtData(null); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRtFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua RT (4)
            </button>
            {RT_BOUNDARIES_DATA.map((rt) => (
              <button
                key={rt.rt}
                onClick={() => handleSelectRt(rt.rt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedRtFilter === rt.rt
                    ? 'ring-2 ring-offset-1 ring-slate-800 text-white shadow-2xs'
                    : 'opacity-90 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: selectedRtFilter === rt.rt ? rt.warnaTema.primary : undefined,
                  color: selectedRtFilter === rt.rt ? '#fff' : undefined,
                  border: selectedRtFilter !== rt.rt ? `1.5px solid ${rt.warnaTema.primary}` : undefined
                }}
              >
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: rt.warnaTema.primary }} />
                <span>
                  RT {rt.rt} ({rt.rt === '039' ? 'Merah' : rt.rt === '040' ? 'Hijau' : rt.rt === '041' ? 'Orange' : 'Kuning'})
                </span>
              </button>
            ))}
          </div>

          {/* 16 Layers Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Layer Tema:</span>
            <select
              value={activeLayer}
              onChange={(e) => setActiveLayer(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">1. Peta Induk & Semua Fasilitas</option>
              <option value="batas">2. Batas Wilayah & Administrasi</option>
              <option value="rumah">3. Sebaran Rumah Warga & KK</option>
              <option value="jalan">4. Infrastruktur Jalan & Kondisi</option>
              <option value="drainase">5. Drainase & Saluran Air Hujan</option>
              <option value="fasum">6. Fasilitas Umum & Ibadah</option>
              <option value="keamanan">7. Keamanan (Gardu Kotak Hitam & CCTV)</option>
              <option value="pju">8. Lampu Penerangan Jalan (PJU)</option>
              <option value="bansos">9. Sebaran Bansos (PKH/BPNT/BLT)</option>
              <option value="umkm">10. UMKM & Potensi Ekonomi</option>
              <option value="pembangunan">11. Program Pembangunan (Musrenbang)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Map View Canvas */}
      {viewMode === 'spatial' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Interactive Map Graphic (SVG) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-3 sm:p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col">
            {/* Map Header & Controls */}
            <div className="flex flex-col gap-2.5 mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-800">
                    🛰️ Foto Satelit Live & Denah Interaktif RW 018
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
                    — Klik pada area RT untuk filter wilayah & letakkan simbol tanda kustom
                  </span>
                </div>

                {/* Satellite View & Zoom Controls */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Satellite Toggle Button */}
                  <button
                    onClick={() => setShowSatelliteBg(!showSatelliteBg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      showSatelliteBg
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Aktifkan / Nonaktifkan Foto Satelit"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{showSatelliteBg ? 'Foto Satelit: ON' : 'Foto Satelit: OFF'}</span>
                  </button>

                  {/* Satellite Opacity Slider / Selector */}
                  {showSatelliteBg && (
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-700">
                      <span className="text-[10px] text-slate-500">Transparansi:</span>
                      <button
                        onClick={() => setSatelliteOpacity(1)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${satelliteOpacity === 1 ? 'bg-white font-bold shadow-xs text-blue-700' : 'hover:bg-slate-200'}`}
                      >
                        100%
                      </button>
                      <button
                        onClick={() => setSatelliteOpacity(0.85)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${satelliteOpacity === 0.85 ? 'bg-white font-bold shadow-xs text-blue-700' : 'hover:bg-slate-200'}`}
                      >
                        85%
                      </button>
                      <button
                        onClick={() => setSatelliteOpacity(0.55)}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${satelliteOpacity === 0.55 ? 'bg-white font-bold shadow-xs text-blue-700' : 'hover:bg-slate-200'}`}
                      >
                        55%
                      </button>
                    </div>
                  )}

                  {/* Zoom & Fullscreen Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
                      className="p-1 hover:bg-white hover:shadow-2xs text-slate-700 rounded text-xs cursor-pointer"
                      title="Perbesar Peta"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
                      className="p-1 hover:bg-white hover:shadow-2xs text-slate-700 rounded text-xs cursor-pointer"
                      title="Perkecil Peta"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setZoomLevel(1); setSelectedPoi(null); setSelectedRtData(null); setSelectedHouse(null); setSelectedCustomMarker(null); }}
                      className="p-1 hover:bg-white hover:shadow-2xs text-slate-700 rounded text-xs cursor-pointer"
                      title="Reset Tampilan Peta"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                      className={`p-1 rounded text-xs cursor-pointer transition-all ${
                        isMapFullscreen
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'hover:bg-white hover:shadow-2xs text-slate-700'
                      }`}
                      title={isMapFullscreen ? 'Keluar dari Layar Penuh (Tutup Full Box)' : 'Layar Penuh Maksimal (Full Screen Full Box)'}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* MENU ALAT SIMBOL TANDA PETA SATELIT LIVE (ADD, MOVE, DELETE, MANAGE) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-2 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-tight text-white block">
                      Alat Simbol Tanda Peta Satelit Live
                    </span>
                    <span className="text-[10px] text-emerald-300 font-medium">
                      Letakkan, pindahkan / geser, edit informasi, atau hapus tanda simbol di peta
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Live Pointer Focus Coordinates Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/50 border border-slate-700 text-xs font-mono text-emerald-300 shadow-inner">
                    <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-slate-400 font-sans">Fokus Pointer:</span>
                    <span className="font-bold text-white">
                      {hoverCoord ? `X:${hoverCoord.x} Y:${hoverCoord.y}` : 'Arahkan kursor'}
                    </span>
                  </div>

                  {/* Grid Snap Toggle */}
                  <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      snapToGrid
                        ? 'bg-amber-400/25 text-amber-300 border border-amber-400/60 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                    title={snapToGrid ? 'Snap Grid 10px Aktif: Gerakan simbol presisi kelipatan 10px' : 'Presisi Bebas 1-Pixel: Gerakan simbol mulus per pixel'}
                  >
                    <span>{snapToGrid ? '🧲 Snap 10px' : '🎯 Presisi Bebas'}</span>
                  </button>

                  {/* Button: Tambah Simbol Tanda Baru */}
                  <button
                    onClick={() => handleOpenAddCustomMarker()}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Tambah dan letakkan simbol tanda baru pada peta satelit"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Simbol Tanda</span>
                  </button>

                  {/* Button: Mode Taruh Simbol di Peta */}
                  <button
                    onClick={() => {
                      if (markerPlacementMode) {
                        setMarkerPlacementMode(false);
                        setDraftMarkerData(null);
                        showToast('Mode taruh simbol dibatalkan.', 'info');
                      } else {
                        setDraftMarkerData({ nama: 'Tanda Baru', simbolBentuk: 'pin', warna: '#2563eb' });
                        setMarkerPlacementMode(true);
                        showToast('🎯 Mode Taruh Aktif: Klik pada foto satelit untuk meletakkan tanda.', 'info');
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      markerPlacementMode
                        ? 'bg-amber-500 text-slate-950 font-black animate-pulse shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                    }`}
                    title="Klik langsung di peta untuk meletakkan simbol tanda"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>{markerPlacementMode ? '🎯 Klik di Peta...' : '🎯 Mode Taruh Cepat'}</span>
                  </button>

                  {/* Button: Kelola Tanda Simbol */}
                  <button
                    onClick={() => setIsManageMarkersModalOpen(true)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-600 cursor-pointer"
                    title="Buka daftar dan kelola semua simbol tanda pada peta"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kelola Tanda ({customMarkers.length})</span>
                  </button>

                  {/* Button: Toggle Tampilkan Simbol */}
                  <button
                    onClick={() => setShowCustomMarkers(!showCustomMarkers)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      showCustomMarkers
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title="Tampilkan atau sembunyikan simbol tanda kustom"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showCustomMarkers ? 'Simbol: ON' : 'Simbol: OFF'}</span>
                  </button>
                </div>
              </div>

              {/* ACTIVE PLACEMENT BANNER */}
              {markerPlacementMode && (
                <div className="bg-amber-500 text-slate-950 px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-extrabold">
                    <Crosshair className="w-4 h-4 animate-spin shrink-0" />
                    <span>
                      🎯 <strong>MODE TARUH AKTIF:</strong> Arahkan pointer mouse ke titik target di peta, simbol tanda bergerak tepat bersama pointer {hoverCoord ? `(Koordinat X: ${hoverCoord.x}, Y: ${hoverCoord.y})` : ''}. Klik untuk meletakkan!
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMarkerPlacementMode(false);
                      setDraftMarkerData(null);
                    }}
                    className="px-2.5 py-1 bg-slate-950 text-white rounded-lg text-[11px] font-black hover:bg-slate-900 cursor-pointer shrink-0"
                  >
                    Batal
                  </button>
                </div>
              )}

              {/* ACTIVE DRAGGING BANNER */}
              {draggingMarkerId && (
                <div className="bg-blue-600 text-white px-3.5 py-2 rounded-xl flex items-center justify-between gap-2 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Move className="w-4 h-4 animate-pulse shrink-0" />
                    <span>
                      🖐️ <strong>Simbol Bergerak Bersama Pointer Mouse:</strong> Posisi titik pointer saat ini {dragCoord ? `(X: ${dragCoord.x}, Y: ${dragCoord.y})` : ''}. Lepaskan tombol mouse di lokasi peta yang diinginkan untuk menyimpan.
                    </span>
                  </div>
                </div>
              )}

              {/* NOTIFICATION TOAST */}
              {mapNotification && (
                <div
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm transition-all ${
                    mapNotification.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : mapNotification.type === 'warning'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-blue-50 text-blue-900 border border-blue-200'
                  }`}
                >
                  <span>{mapNotification.message}</span>
                  <button
                    onClick={() => setMapNotification(null)}
                    className="p-1 hover:bg-black/10 rounded-md text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* SVG Interactive Canvas Container - Supports Full Screen Full Box */}
            <div
              className={`relative w-full bg-slate-950 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center transition-all duration-300 ${
                isMapFullscreen
                  ? 'fixed inset-0 z-50 rounded-none w-screen h-screen max-w-none max-h-none p-2 sm:p-4'
                  : 'aspect-[4/3] sm:aspect-[16/11] rounded-2xl'
              }`}
            >
              {/* Fullscreen Close Button */}
              {isMapFullscreen && (
                <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                  <div className="bg-emerald-900/90 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/50 backdrop-blur-md shadow-lg hidden sm:flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Mode Layar Penuh Maksimal Peta Live RW 018</span>
                  </div>
                  <button
                    onClick={() => setIsMapFullscreen(false)}
                    className="p-2 sm:px-3 sm:py-2 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md cursor-pointer active:scale-95"
                    title="Keluar dari Layar Penuh"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Tutup Layar Penuh</span>
                  </button>
                </div>
              )}

              {/* Compass & 4 Boundaries Indicator Badge */}
              <div className={`absolute right-3 z-20 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700/80 text-white flex flex-col items-center shadow-md pointer-events-none ${
                isMapFullscreen ? 'top-16 sm:top-4 sm:right-48' : 'top-3'
              }`}>
                <Compass className="w-5 h-5 text-emerald-400" />
                <span className="text-[9px] font-black tracking-widest text-amber-300 mt-0.5">U</span>
                <span className="text-[7px] text-slate-400 font-bold">UTARA</span>
              </div>

              {/* Top Boundary Bar Badge */}
              <div className="absolute top-3 left-3 z-20 hidden md:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[10px] text-slate-300 shadow-md pointer-events-none">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Batas RW 018:
                </span>
                <span><strong>U:</strong> Palapa III</span>
                <span className="text-slate-600">•</span>
                <span><strong>S:</strong> Sungai Way Perak</span>
                <span className="text-slate-600">•</span>
                <span><strong>B:</strong> Jl Pala VII (RT 13/RW 06)</span>
                <span className="text-slate-600">•</span>
                <span><strong>T:</strong> Jl Raya Jend. Ahmad Yani</span>
              </div>

              {/* SVG Map Core */}
              <div
                className="w-full h-full transition-transform duration-300 origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <svg
                  ref={svgRef}
                  viewBox="0 0 1000 880"
                  className="w-full h-full select-none"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    cursor: markerPlacementMode ? 'crosshair' : draggingMarkerId ? 'grabbing' : 'default'
                  }}
                  onClick={handleSvgMapClick}
                  onMouseMove={handleSvgMouseMove}
                  onTouchMove={handleSvgTouchMove}
                  onMouseLeave={() => {
                    if (!draggingMarkerId) setHoverCoord(null);
                  }}
                  onMouseUp={handleSvgMouseUpOrEnd}
                  onTouchEnd={handleSvgMouseUpOrEnd}
                >
                  <defs>
                    {/* Road Grid Pattern */}
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    </pattern>

                    {/* Shading Filters */}
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.6" />
                    </filter>
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#22c55e" floodOpacity="0.6" />
                    </filter>
                    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f97316" floodOpacity="0.6" />
                    </filter>
                    <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#eab308" floodOpacity="0.6" />
                    </filter>
                    <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.8" />
                    </filter>
                  </defs>

                  {/* 1. Base Dark Surface */}
                  <rect width="1000" height="880" fill="#080e1a" />
                  <rect width="1000" height="880" fill="url(#grid-pattern)" />

                  {/* REAL SATELLITE PHOTO BACKGROUND (Foto Udara Satelit Google Earth) */}
                  {showSatelliteBg && (
                    <image
                      href="/peta-satelit-rw018.jpg"
                      x="0"
                      y="0"
                      width="1000"
                      height="880"
                      preserveAspectRatio="xMidYMid slice"
                      opacity={satelliteOpacity}
                      className="transition-opacity duration-300"
                    />
                  )}

                  {/* Satellite Aerial Imagery Simulation Backdrop */}
                  {/* Surrounding Vegetation / Roads texture */}
                  <path d="M 130,220 L 440,200 L 600,150 L 880,160 L 870,330 L 780,360 L 620,440 L 540,480 L 540,570 L 440,590 L 130,735 Z" fill="#0f1f18" opacity="0.6" />
                  
                  {/* Surrounding Road Context Lines & Geographical Boundaries */}
                  {/* North Boundary: Palapa III RW 018 */}
                  <line x1="80" y1="130" x2="940" y2="130" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                  <line x1="80" y1="130" x2="940" y2="130" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,8" />
                  <rect x="360" y="102" width="280" height="24" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#475569" strokeWidth="1" />
                  <text x="500" y="118" fill="#f8fafc" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                    ▲ PALAPA III RW 018 (BATAS UTARA)
                  </text>

                  {/* West Boundary: Jl Pala VII RT 13 RW 06 */}
                  <line x1="110" y1="130" x2="110" y2="780" stroke="#334155" strokeWidth="14" strokeLinecap="round" />
                  <line x1="110" y1="130" x2="110" y2="780" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,8" />
                  <g transform="rotate(-90 85 460)">
                    <rect x="-65" y="448" width="300" height="24" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#475569" strokeWidth="1" />
                    <text x="85" y="464" fill="#f8fafc" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                      ◀ JL PALA VII RT 13 RW 06 (BATAS BARAT)
                    </text>
                  </g>

                  {/* East Boundary: Jl Raya Jend. Ahmad Yani */}
                  <line x1="890" y1="130" x2="890" y2="600" stroke="#334155" strokeWidth="14" strokeLinecap="round" />
                  <line x1="890" y1="130" x2="890" y2="600" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,8" />
                  <g transform="rotate(90 915 365)">
                    <rect x="765" y="353" width="300" height="24" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#475569" strokeWidth="1" />
                    <text x="915" y="369" fill="#f8fafc" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                      ▶ JL RAYA JEND. AHMAD YANI (BATAS TIMUR)
                    </text>
                  </g>

                  {/* South Boundary: Sungai Way Perak */}
                  {/* River water flow path with wave effect */}
                  <path
                    d="M 90,755 C 220,720 350,660 525,585 C 650,530 760,450 920,440"
                    fill="none"
                    stroke="#0369a1"
                    strokeWidth="14"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <path
                    d="M 90,755 C 220,720 350,660 525,585 C 650,530 760,450 920,440"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="12,8"
                    opacity="0.95"
                  />
                  <g transform="rotate(-18 310 680)">
                    <rect x="160" y="668" width="300" height="24" rx="6" fill="rgba(3, 105, 161, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="310" y="684" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                      ▼ SUNGAI WAY PERAK (BATAS SELATAN)
                    </text>
                  </g>

                  {/* 2. RT POLYGONS ACCORDING TO USER'S PHOTO */}

                  {/* RT 042 (Top-Left: Kuning / Yellow) */}
                  <polygon
                    points="140,240 428,215 425,390 315,390 315,325 140,325"
                    fill={selectedRtFilter === '042' ? "rgba(234, 179, 8, 0.35)" : "rgba(234, 179, 8, 0.18)"}
                    stroke="#eab308"
                    strokeWidth={selectedRtFilter === '042' ? "6" : "3.5"}
                    className="cursor-pointer transition-all hover:fill-yellow-500/30"
                    onClick={() => handleSelectRt('042')}
                  />

                  {/* RT 040 (Top-Right: Hijau / Green) */}
                  <polygon
                    points="428,215 590,160 860,170 850,250 608,322 428,322 428,215"
                    fill={selectedRtFilter === '040' ? "rgba(34, 197, 94, 0.35)" : "rgba(34, 197, 94, 0.18)"}
                    stroke="#22c55e"
                    strokeWidth={selectedRtFilter === '040' ? "6" : "3.5"}
                    className="cursor-pointer transition-all hover:fill-emerald-500/30"
                    onClick={() => handleSelectRt('040')}
                  />

                  {/* RT 041 (Bottom-Left: Orange) */}
                  <polygon
                    points="140,325 315,325 315,390 425,390 425,570 138,715 140,325"
                    fill={selectedRtFilter === '041' ? "rgba(249, 115, 22, 0.35)" : "rgba(249, 115, 22, 0.18)"}
                    stroke="#f97316"
                    strokeWidth={selectedRtFilter === '041' ? "6" : "3.5"}
                    className="cursor-pointer transition-all hover:fill-orange-500/30"
                    onClick={() => handleSelectRt('041')}
                  />

                  {/* RT 039 (Bottom-Right / Tengah: Merah / Red) */}
                  <polygon
                    points="428,322 608,322 850,250 850,315 760,340 600,420 528,460 525,550 425,570 428,322"
                    fill={selectedRtFilter === '039' ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.18)"}
                    stroke="#ef4444"
                    strokeWidth={selectedRtFilter === '039' ? "6" : "3.5"}
                    className="cursor-pointer transition-all hover:fill-red-500/30"
                    onClick={() => handleSelectRt('039')}
                  />

                  {/* 3. BATAS WILAYAH LUAR RW 018: GARIS TEBAL BIRU TERPUTUS-PUTUS */}
                  <polygon
                    points="138,235 430,210 590,160 860,170 850,315 760,340 600,420 528,460 525,550 425,570 138,715 138,235"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="5.5"
                    strokeDasharray="16,10"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="pointer-events-none"
                  />

                  {/* 4. Internal Environmental Roads & Streets */}
                  {/* Jl. Pala Utama Inter-RT */}
                  <line x1="140" y1="325" x2="425" y2="322" stroke="#334155" strokeWidth="5" />
                  <line x1="428" y1="322" x2="850" y2="250" stroke="#334155" strokeWidth="5" />
                  {/* Jl. Pembatas Barat RT 042 & 041 */}
                  <line x1="428" y1="215" x2="425" y2="570" stroke="#334155" strokeWidth="5" />

                  {/* 5. RT BIG LABELS */}
                  {/* RT 042 Label (Kuning) */}
                  <g className="cursor-pointer" onClick={() => handleSelectRt('042')}>
                    <rect x="230" y="245" width="130" height="42" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#eab308" strokeWidth="2" />
                    <text x="295" y="268" fill="#facc15" fontSize="16" fontWeight="900" textAnchor="middle">RT 042</text>
                    <text x="295" y="281" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="middle">50 KK • 184 Jiwa</text>
                  </g>

                  {/* RT 040 Label (Hijau) */}
                  <g className="cursor-pointer" onClick={() => handleSelectRt('040')}>
                    <rect x="600" y="195" width="130" height="42" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#22c55e" strokeWidth="2" />
                    <text x="665" y="218" fill="#4ade80" fontSize="16" fontWeight="900" textAnchor="middle">RT 040</text>
                    <text x="665" y="231" fill="#bbf7d0" fontSize="10" fontWeight="bold" textAnchor="middle">52 KK • 195 Jiwa</text>
                  </g>

                  {/* RT 041 Label (Orange) */}
                  <g className="cursor-pointer" onClick={() => handleSelectRt('041')}>
                    <rect x="220" y="480" width="130" height="42" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#f97316" strokeWidth="2" />
                    <text x="285" y="503" fill="#fb923c" fontSize="16" fontWeight="900" textAnchor="middle">RT 041</text>
                    <text x="285" y="516" fill="#fed7aa" fontSize="10" fontWeight="bold" textAnchor="middle">48 KK • 176 Jiwa</text>
                  </g>

                  {/* RT 039 Label (Merah) */}
                  <g className="cursor-pointer" onClick={() => handleSelectRt('039')}>
                    <rect x="520" y="375" width="130" height="42" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#ef4444" strokeWidth="2" />
                    <text x="585" y="398" fill="#f87171" fontSize="16" fontWeight="900" textAnchor="middle">RT 039</text>
                    <text x="585" y="411" fill="#fecaca" fontSize="10" fontWeight="bold" textAnchor="middle">45 KK • 168 Jiwa</text>
                  </g>

                  {/* 6. SPECIAL ICONS REQUESTED BY USER */}

                  {/* A. KOTAK KECIL WARNA HITAM: POS RONDA MASING-MASING RT */}
                  {/* Pos Ronda RT 042 */}
                  <g
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={(e) => {
                      e.stopPropagation();
                      const p = POI_LIST_DATA.find(x => x.id === 'poi-pos-042');
                      if (p) setSelectedPoi(p);
                    }}
                  >
                    <rect x="310" y="305" width="20" height="20" rx="3" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="320" cy="315" r="2" fill="#eab308" />
                    <text x="320" y="338" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Pos Ronda RT 042</text>
                  </g>

                  {/* Pos Ronda RT 040 */}
                  <g
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={(e) => {
                      e.stopPropagation();
                      const p = POI_LIST_DATA.find(x => x.id === 'poi-pos-040');
                      if (p) setSelectedPoi(p);
                    }}
                  >
                    <rect x="700" y="252" width="20" height="20" rx="3" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="710" cy="262" r="2" fill="#22c55e" />
                    <text x="710" y="285" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Pos Ronda RT 040</text>
                  </g>

                  {/* Pos Ronda RT 041 */}
                  <g
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={(e) => {
                      e.stopPropagation();
                      const p = POI_LIST_DATA.find(x => x.id === 'poi-pos-041');
                      if (p) setSelectedPoi(p);
                    }}
                  >
                    <rect x="268" y="465" width="20" height="20" rx="3" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="278" cy="475" r="2" fill="#f97316" />
                    <text x="278" y="498" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Pos Ronda RT 041</text>
                  </g>

                  {/* Pos Ronda RT 039 */}
                  <g
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={(e) => {
                      e.stopPropagation();
                      const p = POI_LIST_DATA.find(x => x.id === 'poi-pos-039');
                      if (p) setSelectedPoi(p);
                    }}
                  >
                    <rect x="422" y="530" width="20" height="20" rx="3" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="432" cy="540" r="2" fill="#ef4444" />
                    <text x="432" y="563" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Pos Ronda RT 039</text>
                  </g>

                  {/* B. SEGITIGA: MASJID BAITURRAHMAN */}
                  <g
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={(e) => {
                      e.stopPropagation();
                      const p = POI_LIST_DATA.find(x => x.id === 'poi-masjid-baiturrahman');
                      if (p) setSelectedPoi(p);
                    }}
                  >
                    {/* Outer Pulse */}
                    <circle cx="515" cy="292" r="16" fill="rgba(16, 185, 129, 0.3)" className="animate-ping origin-center" />
                    {/* Triangle Geometry */}
                    <polygon points="515,274 498,304 532,304" fill="#059669" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx="515" cy="294" r="3" fill="#fef08a" />
                    <text x="515" y="320" fill="#34d399" fontSize="11" fontWeight="black" textAnchor="middle">
                      ▲ MASJID BAITURRAHMAN
                    </text>
                  </g>

                  {/* 7. OPTIONAL LAYER: TITIK RUMAH WARGA (Ketika layer rumah/semua aktif) */}
                  {(activeLayer === 'all' || activeLayer === 'rumah') && filteredHouses.map((house) => {
                    const isHouseSelected = selectedHouse?.id === house.id;
                    return (
                      <g
                        key={house.id}
                        className="cursor-pointer hover:scale-150 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHouse(house);
                          setSelectedPoi(null);
                        }}
                      >
                        <circle
                          cx={house.svgPos.x}
                          cy={house.svgPos.y}
                          r={isHouseSelected ? "7" : "4.5"}
                          fill={isHouseSelected ? "#38bdf8" : house.rt === '039' ? '#f87171' : house.rt === '040' ? '#4ade80' : house.rt === '041' ? '#fb923c' : '#facc15'}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        <text
                          x={house.svgPos.x}
                          y={house.svgPos.y - 7}
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                          style={{ textShadow: '0 1px 2px #000' }}
                        >
                          No.{house.noRumah}
                        </text>
                      </g>
                    );
                  })}

                  {/* 8. PJU LAMPU JALAN LAYER (Ketika layer PJU aktif) */}
                  {(activeLayer === 'all' || activeLayer === 'pju') && (
                    <g className="pointer-events-none">
                      {/* PJU points */}
                      <circle cx="430" cy="260" r="3" fill="#fef08a" opacity="0.9" />
                      <circle cx="580" cy="240" r="3" fill="#fef08a" opacity="0.9" />
                      <circle cx="750" cy="220" r="3" fill="#fef08a" opacity="0.9" />
                      <circle cx="280" cy="300" r="3" fill="#fef08a" opacity="0.9" />
                      <circle cx="260" cy="420" r="3" fill="#fef08a" opacity="0.9" />
                      <circle cx="480" cy="460" r="3" fill="#fef08a" opacity="0.9" />
                    </g>
                  )}

                  {/* 9. CCTV LIVE MARKERS */}
                  {(activeLayer === 'all' || activeLayer === 'keamanan') && POI_LIST_DATA.filter(p => p.kategori === 'cctv').map((cctv) => {
                    const isSelected = selectedPoi?.id === cctv.id;
                    return (
                      <g
                        key={cctv.id}
                        className="cursor-pointer hover:scale-125 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPoi(cctv);
                        }}
                      >
                        <circle cx={cctv.svgPos.x * 10} cy={cctv.svgPos.y * 8.8} r={isSelected ? "8" : "5"} fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                        <circle cx={cctv.svgPos.x * 10} cy={cctv.svgPos.y * 8.8} r="2" fill="#ffffff" />
                      </g>
                    );
                  })}

                  {/* 10. SIMBOL TANDA PETA SATELIT LIVE (CUSTOM PLACED MARKERS - INTERAKTIF BISA DIPINDAH / TAMBAH / HAPUS) */}
                  {showCustomMarkers && customMarkers
                    .filter(m => selectedRtFilter === 'ALL' || m.rt === selectedRtFilter || m.rt === 'UMUM')
                    .map((marker) => {
                      const isSelected = selectedCustomMarker?.id === marker.id;
                      const isDragging = draggingMarkerId === marker.id;
                      const posX = isDragging && dragCoord ? dragCoord.x : marker.svgPos.x;
                      const posY = isDragging && dragCoord ? dragCoord.y : marker.svgPos.y;
                      return (
                        <g
                          key={marker.id}
                          transform={`translate(${posX}, ${posY})`}
                          className={`cursor-grab active:cursor-grabbing select-none ${
                            isDragging ? 'scale-125 z-50 transition-none' : 'hover:scale-115 transition-transform duration-150'
                          }`}
                          onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
                          onTouchStart={(e) => handleMarkerTouchStart(e, marker)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!draggingMarkerId) {
                              setSelectedCustomMarker(marker);
                              setSelectedPoi(null);
                              setSelectedHouse(null);
                            }
                          }}
                        >
                          {/* Outer pulse when selected or dragging */}
                          {(isSelected || isDragging) && (
                            <circle cx="0" cy="0" r="24" fill={marker.warna || '#2563eb'} opacity="0.35" className="animate-ping" />
                          )}

                          {/* Render Shape */}
                          {renderSvgMarkerShape(marker)}

                          {/* Marker Label Badge */}
                          <g className="pointer-events-none">
                            <rect
                              x={-(marker.nama.length * 3.4 + 8)}
                              y={marker.simbolBentuk === 'pin' ? -48 : 16}
                              width={marker.nama.length * 6.8 + 16}
                              height="16"
                              rx="4"
                              fill="rgba(15, 23, 42, 0.9)"
                              stroke={marker.warna || '#38bdf8'}
                              strokeWidth="1.2"
                            />
                            <text
                              x="0"
                              y={marker.simbolBentuk === 'pin' ? -37 : 27}
                              fill="#ffffff"
                              fontSize="8.5"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {marker.nama}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                  {/* 11. PRECISION POINTER FOCUS HUD & GUIDES (FOKUS TITIK POINTER MOUSE TEPAT DENGAN GERAK TANDA SIMBOL) */}
                  {(markerPlacementMode || draggingMarkerId) && hoverCoord && (
                    <g id="precision-pointer-focus" className="pointer-events-none">
                      {/* Full-length Crosshair Guidelines */}
                      <line
                        x1="0"
                        y1={hoverCoord.y}
                        x2="1000"
                        y2={hoverCoord.y}
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        opacity="0.65"
                      />
                      <line
                        x1={hoverCoord.x}
                        y1="0"
                        x2={hoverCoord.x}
                        y2="880"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        opacity="0.65"
                      />

                      {/* Concentric Targeting Reticle Rings */}
                      <circle
                        cx={hoverCoord.x}
                        cy={hoverCoord.y}
                        r="24"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        opacity="0.5"
                      />
                      <circle
                        cx={hoverCoord.x}
                        cy={hoverCoord.y}
                        r="10"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="1.8"
                        opacity="0.8"
                      />

                      {/* 4 Crosshair Tick Marks */}
                      <line x1={hoverCoord.x - 16} y1={hoverCoord.y} x2={hoverCoord.x - 4} y2={hoverCoord.y} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <line x1={hoverCoord.x + 4} y1={hoverCoord.y} x2={hoverCoord.x + 16} y2={hoverCoord.y} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <line x1={hoverCoord.x} y1={hoverCoord.y - 16} x2={hoverCoord.x} y2={hoverCoord.y - 4} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <line x1={hoverCoord.x} y1={hoverCoord.y + 4} x2={hoverCoord.x} y2={hoverCoord.y + 16} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

                      {/* Exact Center Bullseye Point matching mouse pointer */}
                      <circle cx={hoverCoord.x} cy={hoverCoord.y} r="3" fill="#facc15" stroke="#000000" strokeWidth="1" />

                      {/* Live Ghost Marker in Placement Mode moving exactly with pointer */}
                      {markerPlacementMode && (
                        <g transform={`translate(${hoverCoord.x}, ${hoverCoord.y})`} opacity="0.85">
                          {renderSvgMarkerShape({
                            id: 'ghost-marker',
                            nama: draftMarkerData?.nama || 'Tanda Baru',
                            simbolBentuk: (draftMarkerData?.simbolBentuk as SimbolBentukType) || 'pin',
                            kategoriLabel: 'Pratinjau Simbol',
                            rt: (draftMarkerData?.rt as any) || 'UMUM',
                            warna: draftMarkerData?.warna || '#2563eb',
                            keterangan: '',
                            svgPos: hoverCoord,
                            createdAt: ''
                          })}
                        </g>
                      )}

                      {/* Real-time Floating Coordinate HUD Tag */}
                      <g transform={`translate(${Math.min(hoverCoord.x + 14, 870)}, ${Math.max(hoverCoord.y - 20, 24)})`}>
                        <rect
                          x="0"
                          y="0"
                          width="114"
                          height="22"
                          rx="6"
                          fill="rgba(15, 23, 42, 0.94)"
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                        />
                        <text x="8" y="14" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                          X:{hoverCoord.x} Y:{hoverCoord.y}
                        </text>
                      </g>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* FLOATING QUICK CARD POPUP FOR SELECTED CUSTOM MARKER */}
            {selectedCustomMarker && (
              <div className="mt-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-3.5 sm:p-4 border border-slate-700/80 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner border border-white/20"
                    style={{ backgroundColor: selectedCustomMarker.warna || '#2563eb' }}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
                        style={{
                          backgroundColor:
                            selectedCustomMarker.rt === '039'
                              ? '#ef4444'
                              : selectedCustomMarker.rt === '040'
                              ? '#22c55e'
                              : selectedCustomMarker.rt === '041'
                              ? '#f97316'
                              : selectedCustomMarker.rt === '042'
                              ? '#eab308'
                              : '#2563eb'
                        }}
                      >
                        {selectedCustomMarker.rt === 'UMUM' ? 'RW' : `RT ${selectedCustomMarker.rt}`}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">
                        Koordinat: X:{selectedCustomMarker.svgPos.x}, Y:{selectedCustomMarker.svgPos.y}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-semibold">
                        • {selectedCustomMarker.kategoriLabel || 'Simbol Wilayah'}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white mt-0.5">
                      {selectedCustomMarker.nama}
                    </h4>

                    {selectedCustomMarker.keterangan && (
                      <p className="text-xs text-slate-300 mt-0.5">
                        {selectedCustomMarker.keterangan}
                      </p>
                    )}

                    {selectedCustomMarker.penanggungJawab && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        PJ: <strong className="text-slate-200">{selectedCustomMarker.penanggungJawab}</strong>
                        {selectedCustomMarker.kontak && (
                          <span className="ml-1 text-slate-300 font-mono">({selectedCustomMarker.kontak})</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions for Selected Marker */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700/80">
                  <button
                    onClick={() => handleStartMoveMarker(selectedCustomMarker)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Pindahkan posisi tanda ini ke titik lain di peta"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>Pindahkan</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditCustomMarker(selectedCustomMarker)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Edit nama, bentuk, warna, atau keterangan tanda"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Info</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Hapus simbol tanda "${selectedCustomMarker.nama}" dari peta satelit?`)) {
                        handleDeleteCustomMarker(selectedCustomMarker.id);
                      }
                    }}
                    className="p-1.5 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Hapus tanda dari peta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedCustomMarker(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Tutup detail"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* KARTU KHUSUS: LEGENDA WARNA & SIMBOL RESMI WILAYAH (TERPISAH & TIDAK MENUTUPI PETA) */}
            <div className="mt-3.5 bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              {/* Header Kartu Legenda */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                      Keterangan Legenda Warna & Simbol Wilayah
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Standar resmi tata ruang peta dokumen RW 018 — Klik RT untuk filter wilayah
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <Info className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Peta Live Bersih 100%</span>
                </div>
              </div>

              {/* Grid Item Legenda: Baris 1 Pembagian RT & Batas */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Batas Wilayah & Blok RT:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                  {/* Batas Luar RW */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-600 dark:border-blue-400 shrink-0" />
                    <span className="font-extrabold text-[11px] truncate">Batas RW 018</span>
                  </div>

                  {/* RT 039 */}
                  <button
                    type="button"
                    onClick={() => handleSelectRt('039')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRtFilter === '039'
                        ? 'bg-red-500 text-white font-black border-red-600 shadow-xs'
                        : 'bg-red-50/70 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60 hover:bg-red-100 font-bold'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 ring-2 ring-red-300 dark:ring-red-900" />
                    <span className="text-[11px] truncate">RT 039 (Merah)</span>
                  </button>

                  {/* RT 040 */}
                  <button
                    type="button"
                    onClick={() => handleSelectRt('040')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRtFilter === '040'
                        ? 'bg-emerald-600 text-white font-black border-emerald-700 shadow-xs'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 font-bold'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-300 dark:ring-emerald-900" />
                    <span className="text-[11px] truncate">RT 040 (Hijau)</span>
                  </button>

                  {/* RT 041 */}
                  <button
                    type="button"
                    onClick={() => handleSelectRt('041')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRtFilter === '041'
                        ? 'bg-orange-500 text-white font-black border-orange-600 shadow-xs'
                        : 'bg-orange-50/70 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/60 hover:bg-orange-100 font-bold'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 ring-2 ring-orange-300 dark:ring-orange-900" />
                    <span className="text-[11px] truncate">RT 041 (Orange)</span>
                  </button>

                  {/* RT 042 */}
                  <button
                    type="button"
                    onClick={() => handleSelectRt('042')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRtFilter === '042'
                        ? 'bg-amber-500 text-white font-black border-amber-600 shadow-xs'
                        : 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 font-bold'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 ring-2 ring-amber-300 dark:ring-amber-900" />
                    <span className="text-[11px] truncate">RT 042 (Kuning)</span>
                  </button>

                  {/* Sungai Way Perak */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60 text-cyan-900 dark:text-cyan-200">
                    <span className="w-4 h-1 rounded-full bg-cyan-500 shrink-0" />
                    <span className="font-extrabold text-[11px] truncate">Sungai Way Perak</span>
                  </div>
                </div>
              </div>

              {/* Grid Item Legenda: Baris 2 Fasilitas & Simbol Geometris */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Simbol Fasilitas, Sarana & Titik Keamanan:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Pos Ronda */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    <span className="w-3.5 h-3.5 bg-slate-900 border border-white rounded-xs shrink-0 flex items-center justify-center text-[8px] text-white font-mono">
                      ■
                    </span>
                    <div>
                      <span className="font-extrabold text-[11px] block leading-tight">Pos Ronda RT</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">4 Titik (Kotak Hitam)</span>
                    </div>
                  </div>

                  {/* Masjid Baiturrahman */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm shrink-0">
                      ▲
                    </span>
                    <div>
                      <span className="font-extrabold text-[11px] block leading-tight">Masjid Baiturrahman</span>
                      <span className="text-[9px] text-emerald-700 dark:text-emerald-400">Segitiga Hijau</span>
                    </div>
                  </div>

                  {/* CCTV Live */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60 text-cyan-900 dark:text-cyan-200">
                    <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 border border-white flex items-center justify-center shrink-0">
                      <span className="w-1 h-1 bg-white rounded-full"></span>
                    </div>
                    <div>
                      <span className="font-extrabold text-[11px] block leading-tight">16 Kamera CCTV</span>
                      <span className="text-[9px] text-cyan-700 dark:text-cyan-400">Titik Biru Cyan Live</span>
                    </div>
                  </div>

                  {/* Lampu PJU & Rumah */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-white shrink-0 flex items-center justify-center text-[7px] font-bold text-slate-900">
                      💡
                    </span>
                    <div>
                      <span className="font-extrabold text-[11px] block leading-tight">PJU & Rumah Warga</span>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400">Penerangan & Nomor Rumah</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Inspector & RT Interactive Dashboard */}
          <div className="lg:col-span-4 space-y-3 flex flex-col">
            {/* Selected POI Inspector Card */}
            {selectedPoi ? (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-500 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                      {renderPoiIcon(selectedPoi.iconName, 'w-5 h-5')}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {selectedPoi.kategoriLabel}
                      </span>
                      <h3 className="text-base font-black text-slate-900 leading-snug mt-0.5">
                        {selectedPoi.nama}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPoi(null)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {selectedPoi.deskripsi}
                </p>

                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs mb-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Alamat / Posisi</span>
                      <span className="font-semibold text-slate-800">{selectedPoi.alamat}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Penanggung Jawab</span>
                      <span className="font-semibold text-slate-800">{selectedPoi.penanggungJawab}</span>
                    </div>
                  </div>

                  {selectedPoi.cctvIpOrId && (
                    <div className="flex items-start gap-2">
                      <Camera className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 text-[10px] block">Kode ID CCTV</span>
                        <span className="font-mono font-bold text-cyan-800 bg-cyan-100/70 px-1.5 py-0.5 rounded">
                          {selectedPoi.cctvIpOrId}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedPoi.kategori === 'cctv' && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          FEED LIVE CCTV {selectedPoi.cctvIpOrId}
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-900 text-emerald-300 text-[8px] font-bold rounded">
                          {selectedPoi.resolution || '1080p'}
                        </span>
                      </div>
                      
                      <div
                        onClick={() => {
                          setSelectedLiveCctv(selectedPoi);
                          setIsLivePlayerOpen(true);
                        }}
                        className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative cursor-pointer group"
                      >
                        <video
                          src={selectedPoi.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4'}
                          poster={selectedPoi.videoThumbnail}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="px-3 py-1 bg-cyan-700/90 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-md">
                            <Maximize2 className="w-3 h-3" />
                            <span>Perbesar Live Feed</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedLiveCctv(selectedPoi);
                          setIsLivePlayerOpen(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Buka Monitor Pantau Interaktif</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">Koordinat GPS</span>
                      <span className="font-mono text-slate-700 text-[11px]">
                        {selectedPoi.koordinat.lat}, {selectedPoi.koordinat.lng}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://maps.google.com/?q=${selectedPoi.koordinat.lat},${selectedPoi.koordinat.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Petunjuk Rute</span>
                  </a>

                  {selectedPoi.kontakPj && (
                    <a
                      href={`https://wa.me/${selectedPoi.kontakPj.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-teal-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ) : selectedHouse ? (
              /* Selected House Inspector Card */
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-sky-500 shadow-md animate-in fade-in">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                      No.{selectedHouse.noRumah}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        Rumah Warga RT {selectedHouse.rt}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">
                        {selectedHouse.namaKepalaKeluarga}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHouse(null)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs mb-3">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Alamat Lengkap:</span>
                    <p className="text-slate-800 font-bold">{selectedHouse.alamat}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Jumlah Anggota KK:</span>
                      <span className="font-bold text-slate-800">{selectedHouse.jumlahAnggota} Orang</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Status Tempat Tinggal:</span>
                      <span className="font-bold text-slate-800">{selectedHouse.statusRumah}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Kategori & Layanan:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedHouse.kategori.map((kat, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md text-[10px] font-bold">
                          {kat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectRt(selectedHouse.rt)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Buka Detail Dashboard RT {selectedHouse.rt}</span>
                </button>
              </div>
            ) : selectedRtData ? (
              /* Selected RT Interactive Dashboard Card */
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 shadow-md animate-in fade-in" style={{ borderColor: selectedRtData.warnaTema.border }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                      style={{ backgroundColor: selectedRtData.warnaTema.primary }}
                    >
                      {selectedRtData.rt}
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selectedRtData.warnaTema.badgeBg}`}>
                        Dashboard Terpadu RT {selectedRtData.rt}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">
                        {selectedRtData.namaRt}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRtData(null)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-tabs in RT Card */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-3 text-[11px] font-bold overflow-x-auto">
                  <button
                    onClick={() => setActiveRtTab('ringkasan')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                      activeRtTab === 'ringkasan' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ringkasan
                  </button>
                  <button
                    onClick={() => setActiveRtTab('rumah')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                      activeRtTab === 'rumah' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rumah & Warga
                  </button>
                  <button
                    onClick={() => setActiveRtTab('infrastruktur')}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                      activeRtTab === 'infrastruktur' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Fasilitas
                  </button>
                </div>

                {activeRtTab === 'ringkasan' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Jumlah KK</span>
                        <span className="text-sm font-black text-slate-800">{selectedRtData.jumlahKk} Kepala Keluarga</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Jumlah Jiwa</span>
                        <span className="text-sm font-black text-slate-800">{selectedRtData.jumlahWarga} Penduduk</span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Ketua RT:</span>
                        <div className="flex items-center justify-between font-bold text-slate-800 mt-0.5">
                          <span>{selectedRtData.ketuaRt}</span>
                          <a
                            href={`https://wa.me/${selectedRtData.noHp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <Phone className="w-3 h-3" /> {selectedRtData.noHp}
                          </a>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-semibold">Cakupan Wilayah:</span>
                        <p className="text-slate-700 font-medium mt-0.5 leading-relaxed">
                          {selectedRtData.cakupanWilayah}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-semibold">Fasilitas Utama di RT Ini:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRtData.fasilitasUtama.map((fas, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-semibold text-slate-700">
                              {fas}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRtTab === 'rumah' && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Daftar Titik Rumah RT {selectedRtData.rt}:</span>
                    {DATA_TITIK_RUMAH.filter(h => h.rt === selectedRtData.rt).map((h) => (
                      <div
                        key={h.id}
                        onClick={() => setSelectedHouse(h)}
                        className="p-2 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200 text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>No.{h.noRumah} - {h.namaKepalaKeluarga}</span>
                          <span className="text-[10px] text-slate-500">{h.jumlahAnggota} Jiwa</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{h.alamat}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeRtTab === 'infrastruktur' && (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">POS RONDA & SISKAMLING:</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        Gardu Siskamling RT {selectedRtData.rt} (Simbol Kotak Hitam di Peta)
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">KAMERA CCTV:</span>
                      <p className="font-bold text-slate-800 mt-0.5">4 Titik Pantau Kamera Standby Online</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">LAMPU PENERANGAN JALAN (PJU):</span>
                      <p className="font-bold text-slate-800 mt-0.5">3 Titik Tiang LED / Solar Cell Terpasang</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedRtFilter(selectedRtData.rt)}
                  className="w-full mt-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fokuskan Peta ke RT {selectedRtData.rt}</span>
                </button>
              </div>
            ) : (
              /* Default Overview Card */
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Batas Geografis RW 018
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Kel. Iringmulyo, Kec. Metro Timur
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs mb-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Batas Utara:</span>
                    <span className="font-semibold text-slate-800">{RW018_SPATIAL_PROFILE.batasWilayah.utara}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Batas Selatan:</span>
                    <span className="font-semibold text-slate-800">{RW018_SPATIAL_PROFILE.batasWilayah.selatan}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Batas Barat:</span>
                    <span className="font-semibold text-slate-800">{RW018_SPATIAL_PROFILE.batasWilayah.barat}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Batas Timur:</span>
                    <span className="font-semibold text-slate-800">{RW018_SPATIAL_PROFILE.batasWilayah.timur}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Informasi Sekretariat RW:
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    {profile.alamatKantor || 'Jl. Pala No.1 Kelurahan Iringmulyo Kecamatan Metro Timur'}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                    Ketua RW: {profile.namaKetuaRw} (HP: {profile.noHpKetuaRw})
                  </p>
                </div>
              </div>
            )}

            {/* 4 RT Quick Cards Grid */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex-1">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" /> 4 Rukun Tetangga (RT)
                </h4>
                <span className="text-[10px] text-slate-400">Pilih RT untuk detail</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {RT_BOUNDARIES_DATA.map((rt) => (
                  <button
                    key={rt.rt}
                    onClick={() => handleSelectRt(rt.rt)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRtFilter === rt.rt
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-2xs'
                        : 'border-slate-200/80 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="px-2 py-0.5 rounded-lg text-white font-black text-[10px]"
                        style={{ backgroundColor: rt.warnaTema.primary }}
                      >
                        RT {rt.rt}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-xs font-black text-slate-900 truncate">
                      {rt.ketuaRt}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {rt.jumlahKk} KK • {rt.jumlahWarga} Jiwa
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Google Maps Live Satelit Embed View */}
      {viewMode === 'google' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700" /> Place Mark Resmi
                </span>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-700" /> Google Maps Live
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                Peta Google Maps Live & Titik Kumpul RW 018 Iringmulyo
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Titik Baku Koordinat: <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">5°07'41.2"S 105°19'00.4"E</span> (-5.128111, 105.316778)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`5°07'41.2"S 105°19'00.4"E`);
                  alert(`Titik Koordinat Baku (5°07'41.2"S 105°19'00.4"E) berhasil disalin ke clipboard!`);
                }}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin Koordinat Baku</span>
              </button>
              <a
                href={RW018_SPATIAL_PROFILE.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Google Maps</span>
              </a>
            </div>
          </div>

          {/* Place Mark Card Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-2xl text-white border border-emerald-700/50 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-400 text-slate-950 rounded-full">
                      Place Mark Terverifikasi
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold">Titik Kumpul Utama</span>
                  </div>
                  <h3 className="text-base font-black tracking-tight mt-0.5">
                    Rumah Ketua RW 018 (Eko Purwanto S.Kom)
                  </h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Jl. Pala No. 1, Kelurahan Iringmulyo, Kecamatan Metro Timur, Kota Metro Lampung (34112)
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/30 text-xs font-mono text-emerald-300">
                <span className="text-[10px] text-slate-400 block font-sans">Titik Baku Koordinat GPS:</span>
                <span className="font-bold text-amber-300 block">5°07'41.2"S 105°19'00.4"E</span>
                <span className="text-[10px] text-slate-400">Lat: -5.128111 | Lng: 105.316778</span>
              </div>
            </div>
          </div>

          {/* Google Maps Embed iframe */}
          <div className="w-full aspect-[16/10] sm:aspect-[21/9] bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative">
            <iframe
              title="Peta Google Maps RW 018 Iringmulyo Metro Timur"
              src="https://maps.google.com/maps?q=5%C2%B007%2741.2%22S+105%C2%B019%2700.4%22E&hl=id&z=18&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="font-bold text-slate-800 block mb-1">📍 Place Mark & Titik Kumpul:</span>
              <p className="text-slate-600">Rumah Ketua RW 018 difungsikan sebagai Titik Kumpul Utama warga saat evakuasi, posko siaga bencana, dan pusat koordinasi tanggap darurat.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="font-bold text-slate-800 block mb-1">🧭 Titik Baku Koordinat:</span>
              <p className="font-mono text-emerald-800 font-bold">5°07'41.2"S 105°19'00.4"E</p>
              <p className="font-mono text-[11px] text-slate-600">Desimal: -5.128111, 105.316778</p>
              <p className="text-[11px] text-slate-500 mt-1">Akurasi GPS tingkat tinggi untuk navigasi warga dan ambulans/damkar.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="font-bold text-slate-800 block mb-1">🏢 Layanan & Bantuan Warga:</span>
              <p className="text-slate-600">Pelayanan administrasi kependudukan, pengurusan surat, siskamling, dan koordinasi RT 039 s.d. RT 042.</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. CCTV Matrix / Titik Pantau Kamera Keamanan Live Streaming & Arsip Cuplikan */}
      {viewMode === 'cctv_matrix' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 animate-fade-in">
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-black rounded-full uppercase flex items-center gap-1.5 border border-cyan-300/60">
                  <Radio className="w-3 h-3 text-cyan-600 animate-pulse" /> Siskamling Digital Live RW 018
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {pois.filter(p => p.kategori === 'cctv').length} Titik CCTV Terpasang & Aktif
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-amber-600" />
                  {cuplikanList.length} Cuplikan Rekaman Tersimpan
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Direktori Titik Pantau Video Live & Arsip Rekaman CCTV RW 018
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pantauan video real-time di seluruh 16 titik kamera dan cuplikan rekaman pendek pantau jalan kampung, perempatan simpang, gardu pos kamling, serta depan SD/fasum.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const firstCctv = pois.find(p => p.kategori === 'cctv');
                  if (firstCctv) {
                    setSelectedLiveCctv(firstCctv);
                    setLivePlayerInitialMode('live');
                    setIsLivePlayerOpen(true);
                  }
                }}
                className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-cyan-500/40"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mode Monitor Pantau Fullscreen</span>
              </button>

              <button
                onClick={handleOpenAddCctv}
                className="py-2 px-3.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Input Titik CCTV Baru</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategoryFilter('cctv');
                  setViewMode('spatial');
                }}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Lihat di Peta</span>
              </button>
            </div>
          </div>

          {/* Sub-Tabs: 🔴 Live Stream 16 Titik vs 🎬 Arsip Cuplikan Rekaman */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setCctvSubTab('live')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                cctvSubTab === 'live'
                  ? 'bg-slate-900 text-cyan-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>🔴 Pantauan Video Live (16 Titik Real-Time)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 font-mono">
                16 Cam
              </span>
            </button>

            <button
              onClick={() => setCctvSubTab('cuplikan')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                cctvSubTab === 'cuplikan'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-amber-200" />
              <span>🎬 Arsip Cuplikan Rekaman Pendek (Jalan, Pos Kamling, Depan SD)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 font-mono">
                {cuplikanList.length} Klip
              </span>
            </button>
          </div>

          {/* SUB-VIEW 1: LIVE STREAM MATRIX */}
          {cctvSubTab === 'live' && (
            <div className="space-y-4">
              {/* Filter Toolbar & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {/* RT Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {[
                    { id: 'ALL', label: 'Semua 16 Kamera' },
                    { id: '039', label: 'RT 039' },
                    { id: '040', label: 'RT 040' },
                    { id: '041', label: 'RT 041' },
                    { id: '042', label: 'RT 042' },
                    { id: 'UMUM', label: 'Pusat / RW' }
                  ].map((tab) => {
                    const count = tab.id === 'ALL'
                      ? pois.filter(p => p.kategori === 'cctv').length
                      : pois.filter(p => p.kategori === 'cctv' && p.rt === tab.id).length;
                    const isSelected = cctvRtFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setCctvRtFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-700 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & AutoPlay Toggle */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={cctvSearchQuery}
                      onChange={(e) => setCctvSearchQuery(e.target.value)}
                      placeholder="Cari CCTV, nomor CAM, jalan..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-medium"
                    />
                    {cctvSearchQuery && (
                      <button
                        onClick={() => setCctvSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setCctvAutoPlayAll(!cctvAutoPlayAll)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 ${
                      cctvAutoPlayAll
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title={cctvAutoPlayAll ? 'Video Auto-Play ON' : 'Mode Hemat Data'}
                  >
                    {cctvAutoPlayAll ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Auto-Play ON</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 text-slate-500" />
                        <span>Hemat Kuota</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CCTV Grid Live Cards (16 Cameras) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {pois
                  .filter(p => p.kategori === 'cctv')
                  .filter(p => cctvRtFilter === 'ALL' || p.rt === cctvRtFilter)
                  .filter(p => {
                    if (!cctvSearchQuery.trim()) return true;
                    const query = cctvSearchQuery.toLowerCase();
                    return (
                      p.nama.toLowerCase().includes(query) ||
                      (p.cctvIpOrId && p.cctvIpOrId.toLowerCase().includes(query)) ||
                      p.alamat.toLowerCase().includes(query) ||
                      p.rt.toLowerCase().includes(query)
                    );
                  })
                  .map((cctv) => (
                    <div
                      key={cctv.id}
                      className="p-3 bg-slate-950 text-white rounded-2xl border border-slate-800 hover:border-cyan-500 transition-all shadow-md group relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Info Bar */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${cctv.isCctvOnline !== false ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                            <span className="font-mono text-[10px] font-bold text-cyan-300 truncate">
                              {cctv.cctvIpOrId || 'CAM-00'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-bold">
                              {cctv.rt === 'UMUM' ? 'RW 018' : `RT ${cctv.rt}`}
                            </span>
                            <span className="px-1 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded text-[8px] font-extrabold">
                              LIVE
                            </span>
                          </div>
                        </div>

                        {/* LIVE VIDEO FEED CONTAINER */}
                        <div
                          onClick={() => {
                            setSelectedLiveCctv(cctv);
                            setLivePlayerInitialMode('live');
                            setIsLivePlayerOpen(true);
                          }}
                          className="aspect-[16/10] bg-slate-900 rounded-xl mb-2.5 relative overflow-hidden border border-slate-800 group-hover:border-cyan-500/80 cursor-pointer shadow-inner"
                        >
                          {/* HTML5 Video Element */}
                          {cctvAutoPlayAll ? (
                            <video
                              src={cctv.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-quiet-street-in-a-residential-neighborhood-43187-large.mp4'}
                              poster={cctv.videoThumbnail || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full relative">
                              <img
                                src={cctv.videoThumbnail || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'}
                                alt={cctv.nama}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-cyan-600/90 text-white flex items-center justify-center shadow-lg">
                                  <Play className="w-5 h-5 ml-0.5" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Live OSD Overlay Stamp */}
                          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 flex items-center gap-1 border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            <span className="text-rose-400 font-black">REC</span>
                            <span className="text-white/60">|</span>
                            <span>{cctv.fps || 25} FPS</span>
                          </div>

                          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-mono text-amber-300 border border-white/10">
                            {cctv.resolution ? cctv.resolution.split(' ')[0] : '1080p'}
                          </div>

                          {/* Hover Fullscreen Prompter */}
                          <div className="absolute inset-0 bg-cyan-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                            <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center shadow-lg">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black tracking-wider uppercase bg-black/60 px-2 py-0.5 rounded-full">
                              Klik Pantau Live
                            </span>
                          </div>
                        </div>

                        {/* Camera Title & Location */}
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {cctv.nama}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {cctv.alamat}
                        </p>

                        {/* GPS Coordinates & PJ Info */}
                        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-300 space-y-0.5">
                          <p className="font-mono text-cyan-300 flex items-center justify-between">
                            <span>📍 {cctv.koordinat?.lat.toFixed(5)}, {cctv.koordinat?.lng.toFixed(5)}</span>
                            <span className="text-slate-500 font-mono text-[9px]">{cctv.bitrate || '2048 Kbps'}</span>
                          </p>
                          <p className="text-slate-400 truncate text-[9px]">PJ: {cctv.penanggungJawab || '-'}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedLiveCctv(cctv);
                            setLivePlayerInitialMode('live');
                            setIsLivePlayerOpen(true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-600/50 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Buka Monitor Layar Penuh"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Live Pantau</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditCctv(cctv)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] transition-colors cursor-pointer"
                          title="Edit Titik CCTV"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPoi(cctv);
                            setViewMode('spatial');
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] transition-colors cursor-pointer"
                          title="Lihat Titik di Peta"
                        >
                          <Compass className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus CCTV "${cctv.nama}"?`)) {
                              handleDeleteCctv(cctv.id);
                            }
                          }}
                          className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 rounded-xl text-[10px] transition-colors cursor-pointer"
                          title="Hapus CCTV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: ARSIP CUPLIKAN REKAMAN PENDEK (Jalan Kampung, Perempatan, Pos Kamling, Depan SD) */}
          {cctvSubTab === 'cuplikan' && (
            <div className="space-y-4">
              {/* Category Filter Pills & Search for Cuplikan */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {[
                    { id: 'ALL', label: '🌟 Semua Cuplikan', count: cuplikanList.length },
                    { id: 'jalan_kampung', label: '🏡 Jalan Kampung', count: cuplikanList.filter(c => c.kategori === 'jalan_kampung').length },
                    { id: 'perempatan', label: '🚦 Perempatan Jalan', count: cuplikanList.filter(c => c.kategori === 'perempatan').length },
                    { id: 'gang', label: '🚶 Gang Pemukiman', count: cuplikanList.filter(c => c.kategori === 'gang').length },
                    { id: 'pos_kamling', label: '👮 Gardu Pos Kamling', count: cuplikanList.filter(c => c.kategori === 'pos_kamling').length },
                    { id: 'depan_sd_fasum', label: '🏫 Depan SD & Fasum', count: cuplikanList.filter(c => c.kategori === 'depan_sd_fasum').length }
                  ].map((cat) => {
                    const isSelected = cuplikanCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCuplikanCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-amber-200'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-amber-800 text-amber-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={cctvSearchQuery}
                    onChange={(e) => setCctvSearchQuery(e.target.value)}
                    placeholder="Cari kejadian, lokasi, tanggal..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  {cctvSearchQuery && (
                    <button
                      onClick={() => setCctvSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Information Banner */}
              <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">
                      Arsip Hasil Rekaman Pendek Pantauan Wilayah RW 018
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Rekaman cuplikan patroli malam, arus persimpangan jalan, aktivitas pos kamling, dan pantauan depan SD.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const fresh = resetStoredCuplikan();
                      setCuplikanList(fresh);
                    }}
                    title="Perbarui data klip rekaman ke video lingkungan jalan kampung, perempatan jalan & gang terbaru"
                    className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:text-amber-100 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Feed Klip Bawaan</span>
                  </button>
                  <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/80 font-mono hidden sm:inline-block">
                    Format: 1080p FHD MP4 (H.264)
                  </span>
                </div>
              </div>

              {/* Grid of Cuplikan Rekaman Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cuplikanList
                  .filter((c) => cuplikanCategoryFilter === 'ALL' || c.kategori === cuplikanCategoryFilter)
                  .filter((c) => {
                    if (!cctvSearchQuery.trim()) return true;
                    const query = cctvSearchQuery.toLowerCase();
                    return (
                      c.judul.toLowerCase().includes(query) ||
                      c.lokasi.toLowerCase().includes(query) ||
                      c.cctvName.toLowerCase().includes(query) ||
                      c.tagKejadian.toLowerCase().includes(query) ||
                      c.kategoriLabel.toLowerCase().includes(query)
                    );
                  })
                  .map((clip) => {
                    const matchedCctv = pois.find(p => p.id === clip.cctvId);
                    return (
                      <div
                        key={clip.id}
                        className="bg-slate-950 text-white rounded-2xl border border-slate-800 hover:border-amber-500 transition-all shadow-md group flex flex-col justify-between overflow-hidden"
                      >
                        <div>
                          {/* Video Thumbnail & Preview Area */}
                          <div
                            onClick={() => {
                              if (matchedCctv) setSelectedLiveCctv(matchedCctv);
                              setLivePlayerInitialMode('cuplikan');
                              setLivePlayerInitialCategory(clip.kategori as any);
                              setIsLivePlayerOpen(true);
                            }}
                            className="aspect-video bg-slate-900 relative overflow-hidden cursor-pointer group-hover:opacity-95"
                          >
                            <img
                              src={clip.thumbnail}
                              alt={clip.judul}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="w-11 h-11 rounded-full bg-amber-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 ml-0.5" />
                              </div>
                            </div>

                            {/* Top Badges */}
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-xs">
                                {clip.kategoriLabel.split('/')[0]}
                              </span>
                            </div>

                            <div className="absolute top-2 right-2 flex items-center gap-1">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-amber-300 border border-white/10">
                                {clip.durasi}
                              </span>
                            </div>

                            {/* Bottom OSD timestamp */}
                            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-slate-200 bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs">
                              <span>{clip.waktuRekam}</span>
                              <span className="text-cyan-300">{clip.resolusi}</span>
                            </div>
                          </div>

                          {/* Content Body */}
                          <div className="p-3">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono font-bold text-amber-400 truncate">
                                📍 {clip.cctvName}
                              </span>
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                                {clip.ukuranFile}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                              {clip.judul}
                            </h4>

                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                              {clip.lokasi}
                            </p>

                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 flex items-center gap-1">
                                <span className="text-cyan-300 font-semibold">{clip.tagKejadian}</span>
                              </span>
                              <span className="text-[9px] text-slate-500">
                                Cam ID: {matchedCctv?.cctvIpOrId || 'CAM-XX'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-3 pt-0 flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (matchedCctv) setSelectedLiveCctv(matchedCctv);
                              setLivePlayerInitialMode('cuplikan');
                              setLivePlayerInitialCategory(clip.kategori as any);
                              setIsLivePlayerOpen(true);
                            }}
                            className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Putar Cuplikan</span>
                          </button>

                          {matchedCctv && (
                            <button
                              onClick={() => {
                                setSelectedPoi(matchedCctv);
                                setViewMode('spatial');
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] transition-colors cursor-pointer"
                              title="Lihat Titik Kamera di Peta"
                            >
                              <Compass className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Comprehensive Thematic Data Sections: Infrastruktur, Drainase, PJU & Program */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Infrastruktur Jalan */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700" />
                Infrastruktur Jalan & Kondisi
              </h3>
              <p className="text-[11px] text-slate-500">Pencatatan ruas jalan lingkungan, dimensi & kondisi fisik</p>
            </div>
            <button
              onClick={handleOpenAddJalan}
              className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Jalan</span>
            </button>
          </div>
          <div className="space-y-2">
            {jalanList.map((jln) => (
              <div key={jln.id} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">
                      {jln.rt}
                    </span>
                    <span>{jln.namaJalan}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      jln.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {jln.kondisi}
                    </span>
                    <button
                      onClick={() => handleOpenEditJalan(jln)}
                      className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                      title="Edit Ruas Jalan"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                  <span>Panjang: {jln.panjangMeter}m</span>
                  <span>Lebar: {jln.lebarMeter}m</span>
                  <span>Permukaan: {jln.jenisPermukaan}</span>
                  <span>Tahun: {jln.tahunPembangunan}</span>
                </div>
                {jln.catatanMusrenbang && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Catatan: {jln.catatanMusrenbang}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PJU & Drainase */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                PJU (Penerangan Jalan Umum)
              </h3>
              <p className="text-[11px] text-slate-500">Titik tiang lampu penerangan jalan umum RW 018</p>
            </div>
            <button
              onClick={handleOpenAddPju}
              className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input PJU</span>
            </button>
          </div>
          <div className="space-y-2">
            {pjuList.map((pju) => (
              <div key={pju.id} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-mono text-[9px] font-bold">
                      {pju.nomorTiang}
                    </span>
                    <span>{pju.lokasi}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pju.kondisi === 'Menyala' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pju.kondisi}
                    </span>
                    <button
                      onClick={() => handleOpenEditPju(pju)}
                      className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                      title="Edit Titik PJU"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                  <span>Wilayah: {pju.rt}</span>
                  <span>Tipe: {pju.jenisLampu}</span>
                  <span>Pengecekan: {pju.tanggalPengecekan}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Drainase Subsection */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Sistem Saluran Drainase & Got
              </span>
              <button
                onClick={handleOpenAddDrainase}
                className="py-0.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Input Drainase</span>
              </button>
            </div>
            <div className="space-y-2">
              {drainaseList.map((drn) => (
                <div key={drn.id} className="p-2 bg-blue-50/50 rounded-xl border border-blue-200/60 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-0.5">
                    <span>{drn.lokasi}</span>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {drn.kondisi}
                      </span>
                      <button
                        onClick={() => handleOpenEditDrainase(drn)}
                        className="p-0.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {drn.rt} • {drn.panjang} • {drn.kedalaman}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Comprehensive Facilities Directory Table */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Direktori Lengkap Fasilitas & Titik Penting RW 018
            </h3>
            <p className="text-xs text-slate-500">
              Daftar seluruh pos ronda, tempat ibadah, balai posyandu, sentra UMKM, dan pos kamling RW 018
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-auto">
            Total {filteredPois.length} Titik Terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-3 font-bold">No</th>
                <th className="py-2.5 px-3 font-bold">Nama Fasilitas / Objek</th>
                <th className="py-2.5 px-3 font-bold">Kategori</th>
                <th className="py-2.5 px-3 font-bold">Wilayah RT</th>
                <th className="py-2.5 px-3 font-bold">Lokasi / Alamat</th>
                <th className="py-2.5 px-3 font-bold">Penanggung Jawab</th>
                <th className="py-2.5 px-3 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPois.map((poi, idx) => (
                <tr
                  key={poi.id}
                  onClick={() => {
                    setSelectedPoi(poi);
                    setViewMode('spatial');
                  }}
                  className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-slate-100 rounded-md text-slate-700 shrink-0">
                        {renderPoiIcon(poi.iconName, 'w-3.5 h-3.5')}
                      </div>
                      <span className="line-clamp-1">{poi.nama}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {poi.kategoriLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-900 text-white">
                      RT {poi.rt}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{poi.alamat}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{poi.penanggungJawab}</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {poi.kategori === 'cctv' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditCctv(poi);
                          }}
                          className="p-1 text-cyan-700 hover:bg-cyan-50 rounded-md transition-colors"
                          title="Edit Titik CCTV"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPoi(poi);
                          setViewMode('spatial');
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Lihat di Peta
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <CctvLivePlayerModal
        isOpen={isLivePlayerOpen}
        onClose={() => setIsLivePlayerOpen(false)}
        selectedCctv={selectedLiveCctv}
        cctvList={pois.filter(p => p.kategori === 'cctv')}
        allCctvList={pois.filter(p => p.kategori === 'cctv')}
        onSelectCctv={(cctv) => setSelectedLiveCctv(cctv)}
        initialMode={livePlayerInitialMode}
        initialClipCategory={livePlayerInitialCategory}
      />

      <CctvFormModal
        isOpen={isCctvModalOpen}
        onClose={() => setIsCctvModalOpen(false)}
        onSave={handleSaveCctv}
        onDelete={handleDeleteCctv}
        editingCctv={editingCctv}
      />

      <JalanFormModal
        isOpen={isJalanModalOpen}
        onClose={() => setIsJalanModalOpen(false)}
        onSave={handleSaveJalan}
        onDelete={handleDeleteJalan}
        editingJalan={editingJalan}
      />

      <PjuFormModal
        isOpen={isPjuModalOpen}
        onClose={() => setIsPjuModalOpen(false)}
        onSave={handleSavePju}
        onDelete={handleDeletePju}
        editingPju={editingPju}
      />

      <DrainaseFormModal
        isOpen={isDrainaseModalOpen}
        onClose={() => setIsDrainaseModalOpen(false)}
        onSave={handleSaveDrainase}
        onDelete={handleDeleteDrainase}
        editingDrainase={editingDrainase}
      />

      {/* CUSTOM MARKERS MODALS */}
      <CustomMarkerModal
        isOpen={isCustomMarkerModalOpen}
        onClose={() => setIsCustomMarkerModalOpen(false)}
        onSave={handleSaveCustomMarker}
        onDelete={handleDeleteCustomMarker}
        editingMarker={editingCustomMarker}
        initialPos={initialMarkerPos || undefined}
        onStartClickToPlace={handleStartClickToPlace}
      />

      <ManageMarkersModal
        isOpen={isManageMarkersModalOpen}
        onClose={() => setIsManageMarkersModalOpen(false)}
        markers={customMarkers}
        onOpenAddModal={() => handleOpenAddCustomMarker()}
        onOpenEditModal={(marker) => handleOpenEditCustomMarker(marker)}
        onDeleteMarker={(id) => handleDeleteCustomMarker(id)}
        onResetMarkers={handleResetCustomMarkers}
        onFocusMarker={(marker) => {
          setSelectedCustomMarker(marker);
          setViewMode('spatial');
          setZoomLevel(1.2);
          showToast(`🎯 Fokus ke simbol tanda "${marker.nama}" di RT ${marker.rt}`, 'info');
        }}
        onStartMoveMarker={(marker) => {
          handleStartMoveMarker(marker);
          setViewMode('spatial');
        }}
      />
    </div>
  );
};

