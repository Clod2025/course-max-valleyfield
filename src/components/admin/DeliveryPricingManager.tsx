import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  MapPin, 
  Clock, 
  Plus,
  Edit,
  Save,
  Trash2,
  ChevronDown,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Données des territoires, provinces et villes du Canada
const CANADIAN_LOCATIONS = {
  'Alberta': {
    regions: ['Calgary Region', 'Edmonton Region', 'Central Alberta', 'Northern Alberta', 'Southern Alberta'],
    cities: [
      'Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'Medicine Hat', 'Grande Prairie', 
      'Airdrie', 'Spruce Grove', 'Leduc', 'Lloydminster', 'Camrose', 'Brooks', 'Cold Lake',
      'Wetaskiwin', 'Lacombe', 'Stony Plain', 'Canmore', 'Cochrane', 'Fort Saskatchewan',
      'Okotoks', 'High River', 'Beaumont', 'Sylvan Lake', 'Whitecourt', 'Hinton'
    ]
  },
  'Colombie-Britannique': {
    regions: ['Lower Mainland', 'Vancouver Island', 'Interior', 'Northern BC', 'Kootenays'],
    cities: [
      'Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Langley',
      'Saanich', 'Delta', 'North Vancouver', 'Maple Ridge', 'Nanaimo', 'Kamloops',
      'Kelowna', 'Chilliwack', 'Prince George', 'Vernon', 'Courtenay', 'Campbell River',
      'Penticton', 'Mission', 'Port Coquitlam', 'New Westminster', 'West Vancouver',
      'North Vancouver District', 'Port Moody', 'Cranbrook', 'Fort St. John'
    ]
  },
  'Manitoba': {
    regions: ['Winnipeg Region', 'Western Manitoba', 'Eastern Manitoba', 'Northern Manitoba', 'Central Manitoba'],
    cities: [
      'Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler',
      'Selkirk', 'Morden', 'Dauphin', 'The Pas', 'Flin Flon', 'Swan River', 'Neepawa',
      'Gimli', 'Stonewall', 'Carman', 'Virden', 'Minnedosa', 'Killarney', 'Boissevain'
    ]
  },
  'Nouveau-Brunswick': {
    regions: ['Sud du Nouveau-Brunswick', 'Nord du Nouveau-Brunswick', 'Vallée du fleuve Saint-Jean', 'Côte de Fundy'],
    cities: [
      'Moncton', 'Saint John', 'Fredericton', 'Dieppe', 'Riverview', 'Edmundston',
      'Miramichi', 'Bathurst', 'Campbellton', 'Caraquet', 'Sussex', 'Sackville',
      'Woodstock', 'Shediac', 'Oromocto', 'Grand Falls', 'Dalhousie', 'Tracadie-Sheila'
    ]
  },
  'Terre-Neuve-et-Labrador': {
    regions: ['Avalon Peninsula', 'Central Newfoundland', 'Western Newfoundland', 'Labrador'],
    cities: [
      'St. John\'s', 'Mount Pearl', 'Corner Brook', 'Conception Bay South', 'Paradise',
      'Grand Falls-Windsor', 'Happy Valley-Goose Bay', 'Gander', 'Carbonear', 'Stephenville',
      'Portugal Cove-St. Philip\'s', 'Torbay', 'Labrador City', 'Bay Roberts', 'Clarenville'
    ]
  },
  'Territoires du Nord-Ouest': {
    regions: ['Région de Yellowknife', 'Région du Dehcho', 'Région du Sahtu', 'Région d\'Inuvik'],
    cities: [
      'Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith', 'Behchokǫ̀', 'Iqaluit',
      'Norman Wells', 'Fort Simpson', 'Fort McPherson', 'Tuktoyaktuk'
    ]
  },
  'Nouvelle-Écosse': {
    regions: ['Halifax Regional Municipality', 'Cape Breton', 'South Shore', 'Annapolis Valley', 'Northern Nova Scotia'],
    cities: [
      'Halifax', 'Sydney', 'Dartmouth', 'Truro', 'New Glasgow', 'Glace Bay',
      'Kentville', 'Amherst', 'Yarmouth', 'Bridgewater', 'Antigonish', 'Stellarton',
      'Wolfville', 'Windsor', 'Liverpool', 'Digby', 'Oxford', 'Pictou'
    ]
  },
  'Nunavut': {
    regions: ['Région de Qikiqtaaluk', 'Région de Kivalliq', 'Région de Kitikmeot'],
    cities: [
      'Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake', 'Igloolik', 'Pangnirtung',
      'Cape Dorset', 'Pond Inlet', 'Gjoa Haven', 'Cambridge Bay', 'Kugluktuk', 'Taloyoak'
    ]
  },
  'Ontario': {
    regions: ['Greater Toronto Area', 'Eastern Ontario', 'Northern Ontario', 'Southwestern Ontario', 'Central Ontario'],
    cities: [
      'Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham',
      'Vaughan', 'Kitchener', 'Windsor', 'Richmond Hill', 'Oakville', 'Burlington',
      'Oshawa', 'Barrie', 'St. Catharines', 'Cambridge', 'Waterloo', 'Guelph',
      'Sudbury', 'Kingston', 'Thunder Bay', 'Whitby', 'Chatham-Kent', 'Ajax',
      'Pickering', 'Sarnia', 'Sault Ste. Marie', 'Newmarket', 'Milton', 'Brantford'
    ]
  },
  'Île-du-Prince-Édouard': {
    regions: ['Queens County', 'Kings County', 'Prince County'],
    cities: [
      'Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Montague', 'Kensington',
      'Souris', 'Alberton', 'Georgetown', 'Tignish', 'Borden-Carleton'
    ]
  },
  'Québec': {
    regions: ['Montréal', 'Québec', 'Saguenay–Lac-Saint-Jean', 'Mauricie', 'Estrie', 'Outaouais', 'Abitibi-Témiscamingue', 'Côte-Nord', 'Nord-du-Québec', 'Gaspésie–Îles-de-la-Madeleine', 'Chaudière-Appalaches', 'Laval', 'Lanaudière', 'Laurentides', 'Montérégie', 'Centre-du-Québec', 'Bas-Saint-Laurent'],
    cities: [
      'Montréal', 'Québec', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay',
      'Lévis', 'Trois-Rivières', 'Terrebonne', 'Saint-Jean-sur-Richelieu', 'Repentigny',
      'Boucherville', 'Saint-Jérôme', 'Châteauguay', 'Drummondville', 'Granby',
      'Saint-Hyacinthe', 'Shawinigan', 'Dollard-des-Ormeaux', 'Rimouski', 'Victoriaville',
      'Saint-Eustache', 'Saint-Bruno-de-Montarville', 'Mascouche', 'Beloeil', 'Salaberry-de-Valleyfield',
      'Blainville', 'Mirabel', 'Brossard', 'Alma', 'Thetford Mines', 'Rouyn-Noranda'
    ]
  },
  'Saskatchewan': {
    regions: ['Regina Region', 'Saskatoon Region', 'Northern Saskatchewan', 'Southwest Saskatchewan', 'Southeast Saskatchewan'],
    cities: [
      'Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton',
      'North Battleford', 'Estevan', 'Weyburn', 'Lloydminster', 'Martensville',
      'Warman', 'Kindersley', 'Melfort', 'Humboldt', 'Meadow Lake', 'Melville'
    ]
  },
  'Yukon': {
    regions: ['Whitehorse Region', 'Northern Yukon', 'Southern Yukon'],
    cities: [
      'Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction', 'Mayo',
      'Carmacks', 'Faro', 'Ross River', 'Teslin', 'Old Crow'
    ]
  }
};

interface PricingZone {
  id: string;
  territory: string;
  region: string;
  city: string;
  base_price: number;
  price_per_km: number;
  price_per_minute: number;
  is_active: boolean;
}

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
}

function Autocomplete({ label, value, onChange, options, placeholder, required }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  useEffect(() => {
    if (value) {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [value, options]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Label htmlFor={label.toLowerCase()}>{label} {required && '*'}</Label>
      <div className="relative">
        <Input
          id={label.toLowerCase()}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="pr-8"
        />
        <ChevronDown 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.slice(0, 10).map((option, index) => (
            <div
              key={index}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>
              {value === option && <Check className="w-4 h-4 text-primary" />}
            </div>
          ))}
          {filteredOptions.length > 10 && (
            <div className="px-3 py-2 text-sm text-muted-foreground border-t">
              +{filteredOptions.length - 10} autres résultats...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DeliveryPricingManager() {
  const { toast } = useToast();
  const [zones, setZones] = useState<PricingZone[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingZone, setEditingZone] = useState<PricingZone | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    territory: '',
    region: '',
    city: '',
    base_price: '',
    price_per_km: '',
    price_per_minute: '',
  });

  useEffect(() => {
    loadPricingZones();
  }, []);

  const loadPricingZones = async () => {
    // Simuler le chargement depuis la base de données
    setZones([
      {
        id: '1',
        territory: 'Québec',
        region: 'Montérégie',
        city: 'Salaberry-de-Valleyfield',
        base_price: 3.99,
        price_per_km: 1.50,
        price_per_minute: 0.25,
        is_active: true
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.territory || !formData.region || !formData.city || !formData.base_price || !formData.price_per_km) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const newZone: PricingZone = {
        id: Date.now().toString(),
        territory: formData.territory,
        region: formData.region,
        city: formData.city,
        base_price: parseFloat(formData.base_price),
        price_per_km: parseFloat(formData.price_per_km),
        price_per_minute: parseFloat(formData.price_per_minute) || 0,
        is_active: true
      };

      if (editingZone) {
        setZones(prev => prev.map(zone => 
          zone.id === editingZone.id ? { ...newZone, id: editingZone.id } : zone
        ));
        toast({
          title: "Succès",
          description: `Tarification pour ${formData.city}, ${formData.region} mise à jour`,
        });
      } else {
        setZones(prev => [...prev, newZone]);
        toast({
          title: "Succès",
          description: `Tarification pour ${formData.city}, ${formData.region} ajoutée`,
        });
      }

      setFormData({ territory: '', region: '', city: '', base_price: '', price_per_km: '', price_per_minute: '' });
      setShowAddForm(false);
      setEditingZone(null);

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la tarification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zone: PricingZone) => {
    setEditingZone(zone);
    setFormData({
      territory: zone.territory,
      region: zone.region,
      city: zone.city,
      base_price: zone.base_price.toString(),
      price_per_km: zone.price_per_km.toString(),
      price_per_minute: zone.price_per_minute.toString(),
    });
    setShowAddForm(true);
  };

  const handleDelete = (zoneId: string) => {
    setZones(prev => prev.filter(zone => zone.id !== zoneId));
    toast({
      title: "Succès",
      description: "Tarification supprimée",
    });
  };

  // Obtenir les options en fonction des sélections
  const getTerritoryOptions = () => Object.keys(CANADIAN_LOCATIONS);
  
  const getRegionOptions = () => {
    if (!formData.territory) return [];
    return CANADIAN_LOCATIONS[formData.territory as keyof typeof CANADIAN_LOCATIONS]?.regions || [];
  };
  
  const getCityOptions = () => {
    if (!formData.territory) return [];
    return CANADIAN_LOCATIONS[formData.territory as keyof typeof CANADIAN_LOCATIONS]?.cities || [];
  };

  // Auto-remplir les tarifs par défaut selon la région
  const handleTerritoryChange = (territory: string) => {
    setFormData(prev => ({ 
      ...prev, 
      territory, 
      region: '', 
      city: '',
      // Tarifs par défaut selon le territoire
      base_price: territory === 'Québec' ? '3.99' : territory === 'Ontario' ? '4.99' : '5.99',
      price_per_km: territory === 'Québec' ? '1.50' : territory === 'Ontario' ? '1.75' : '2.00',
      price_per_minute: '0.25'
    }));
  };

  const handleRegionChange = (region: string) => {
    setFormData(prev => ({ ...prev, region, city: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gestion de la Tarification</h2>
            <p className="text-muted-foreground">
              Configurez les tarifs de livraison par ville canadienne
            </p>
          </div>
        </div>
        
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Ville
        </Button>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingZone ? 'Modifier la Tarification' : 'Nouvelle Tarification'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection géographique */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Autocomplete
                  label="Territoire"
                  value={formData.territory}
                  onChange={handleTerritoryChange}
                  options={getTerritoryOptions()}
                  placeholder="Ex: Québec"
                  required
                />
                
                <Autocomplete
                  label="Région"
                  value={formData.region}
                  onChange={handleRegionChange}
                  options={getRegionOptions()}
                  placeholder="Ex: Montérégie"
                  required
                />
                
                <Autocomplete
                  label="Ville"
                  value={formData.city}
                  onChange={(city) => setFormData(prev => ({ ...prev, city }))}
                  options={getCityOptions()}
                  placeholder="Ex: Salaberry-de-Valleyfield"
                  required
                />
              </div>

              {/* Configuration tarifaire */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">Prix de base *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                    placeholder="3.99"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix minimum de livraison
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="price_per_km">Prix par kilomètre *</Label>
                  <Input
                    id="price_per_km"
                    type="number"
                    step="0.01"
                    value={formData.price_per_km}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_km: e.target.value }))}
                    placeholder="1.50"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Coût additionnel par km
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="price_per_minute">Prix par minute</Label>
                  <Input
                    id="price_per_minute"
                    type="number"
                    step="0.01"
                    value={formData.price_per_minute}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_minute: e.target.value }))}
                    placeholder="0.25"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Coût par minute (optionnel)
                  </p>
                </div>
              </div>

              {/* Aperçu du calcul */}
              {formData.base_price && formData.price_per_km && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Aperçu du calcul</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="font-bold text-lg">
                        {(parseFloat(formData.base_price) + 5 * parseFloat(formData.price_per_km)).toFixed(2)}$
                      </div>
                      <div className="text-muted-foreground">Livraison 5km</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="font-bold text-lg">
                        {(parseFloat(formData.base_price) + 10 * parseFloat(formData.price_per_km)).toFixed(2)}$
                      </div>
                      <div className="text-muted-foreground">Livraison 10km</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="font-bold text-lg">
                        {(parseFloat(formData.base_price) + 15 * parseFloat(formData.price_per_km)).toFixed(2)}$
                      </div>
                      <div className="text-muted-foreground">Livraison 15km</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingZone(null);
                    setFormData({ territory: '', region: '', city: '', base_price: '', price_per_km: '', price_per_minute: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingZone ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des tarifications */}
      <div className="grid gap-4">
        {zones.map((zone) => (
          <Card key={zone.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">{zone.city}</h3>
                      <p className="text-sm text-muted-foreground">{zone.region}, {zone.territory}</p>
                    </div>
                    <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                      {zone.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(zone)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => handleDelete(zone.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Prix de base</span>
                  </div>
                  <div className="text-xl font-bold">{zone.base_price.toFixed(2)}$</div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Par km</span>
                  </div>
                  <div className="text-xl font-bold">{zone.price_per_km.toFixed(2)}$</div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Par min</span>
                  </div>
                  <div className="text-xl font-bold">{zone.price_per_minute.toFixed(2)}$</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune tarification configurée</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez votre première ville avec sa tarification
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ville
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}