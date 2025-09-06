import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Wrench, 
  MapPin,
  Plus,
  Save,
  AlertTriangle,
  ChevronDown,
  Check,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Données complètes des territoires, provinces et villes du Canada
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

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}

function Autocomplete({ label, value, onChange, options, placeholder, required, disabled }: AutocompleteProps) {
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
          disabled={disabled}
          className="pr-8"
        />
        <ChevronDown 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer"
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>
      
      {isOpen && filteredOptions.length > 0 && !disabled && (
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

export function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  
  const [newCity, setNewCity] = useState({
    territory: '',
    region: '',
    city: '',
  });

  const [existingCities, setExistingCities] = useState([
    { id: '1', territory: 'Québec', region: 'Montérégie', city: 'Salaberry-de-Valleyfield' },
    { id: '2', territory: 'Québec', region: 'Montérégie', city: 'Beauharnois' },
    { id: '3', territory: 'Québec', region: 'Montréal', city: 'Montréal' },
  ]);

  const handleMaintenanceToggle = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMaintenanceMode(!maintenanceMode);
      
      toast({
        title: maintenanceMode ? "Mode maintenance désactivé" : "Mode maintenance activé",
        description: maintenanceMode 
          ? "Le service est maintenant disponible" 
          : "Un avis de maintenance sera affiché sur toutes les pages",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mode maintenance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCity.territory || !newCity.region || !newCity.city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si la ville existe déjà
    const cityExists = existingCities.some(city => 
      city.territory === newCity.territory && 
      city.region === newCity.region && 
      city.city.toLowerCase() === newCity.city.toLowerCase()
    );

    if (cityExists) {
      toast({
        title: "Erreur",
        description: "Cette ville existe déjà dans la liste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCityEntry = {
        id: Date.now().toString(),
        territory: newCity.territory,
        region: newCity.region,
        city: newCity.city
      };

      setExistingCities(prev => [...prev, newCityEntry]);
      
      toast({
        title: "Ville ajoutée",
        description: `${newCity.city}, ${newCity.region} a été ajoutée avec succès`,
      });
      
      setNewCity({ territory: '', region: '', city: '' });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ville",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCity = (cityId: string) => {
    setExistingCities(prev => prev.filter(city => city.id !== cityId));
    toast({
      title: "Ville supprimée",
      description: "La ville a été retirée de la liste",
    });
  };

  // Obtenir les options en fonction des sélections
  const getTerritoryOptions = () => Object.keys(CANADIAN_LOCATIONS);
  
  const getRegionOptions = () => {
    if (!newCity.territory) return [];
    return CANADIAN_LOCATIONS[newCity.territory as keyof typeof CANADIAN_LOCATIONS]?.regions || [];
  };
  
  const getCityOptions = () => {
    if (!newCity.territory) return [];
    return CANADIAN_LOCATIONS[newCity.territory as keyof typeof CANADIAN_LOCATIONS]?.cities || [];
  };

  const handleTerritoryChange = (territory: string) => {
    setNewCity(prev => ({ 
      ...prev, 
      territory, 
      region: '', 
      city: ''
    }));
  };

  const handleRegionChange = (region: string) => {
    setNewCity(prev => ({ ...prev, region, city: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Paramètres Administrateur</h2>
          <p className="text-muted-foreground">
            Configurez les paramètres globaux de CourseMax
          </p>
        </div>
      </div>

      {/* Mode maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Mode Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-semibold">Activer le mode maintenance</h4>
              <p className="text-sm text-muted-foreground">
                Affiche un avis de maintenance sur toutes les interfaces
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={maintenanceMode ? 'destructive' : 'outline'}>
                {maintenanceMode ? 'Actif' : 'Inactif'}
              </Badge>
              <Button 
                variant={maintenanceMode ? 'destructive' : 'default'}
                onClick={handleMaintenanceToggle}
                disabled={loading}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {maintenanceMode ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          </div>
          
          {maintenanceMode && (
            <div>
              <Label htmlFor="maintenance_message">Message de maintenance</Label>
              <Textarea
                id="maintenance_message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Le service sera temporairement indisponible pour maintenance..."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestion des villes avec autocomplétion complète */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Ajouter une Nouvelle Ville
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Autocomplete
              label="Territoire"
              value={newCity.territory}
              onChange={handleTerritoryChange}
              options={getTerritoryOptions()}
              placeholder="Ex: Québec"
              required
            />
            
            <Autocomplete
              label="Région"
              value={newCity.region}
              onChange={handleRegionChange}
              options={getRegionOptions()}
              placeholder="Ex: Montérégie"
              required
              disabled={!newCity.territory}
            />
            
            <Autocomplete
              label="Ville"
              value={newCity.city}
              onChange={(city) => setNewCity(prev => ({ ...prev, city }))}
              options={getCityOptions()}
              placeholder="Ex: Salaberry-de-Valleyfield"
              required
              disabled={!newCity.territory}
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleAddCity} disabled={loading || !newCity.territory || !newCity.region || !newCity.city}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la Ville
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Villes existantes */}
      <Card>
        <CardHeader>
          <CardTitle>Villes Desservies ({existingCities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {existingCities.map((location) => (
              <div key={location.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{location.city}</h4>
                  <p className="text-sm text-muted-foreground">
                    {location.region}, {location.territory}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveCity(location.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {existingCities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune ville configurée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autres paramètres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres Généraux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Notifications email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Notifications push</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Sécurité</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Authentification à deux facteurs</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Logs d'activité</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder les Paramètres
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
