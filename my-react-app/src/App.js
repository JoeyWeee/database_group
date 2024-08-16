import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, LabelList
} from 'recharts';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, AppBar, Toolbar, Button, Container, Typography } from '@mui/material';

const App = () => {
  const [data, setData] = useState([]);
  const [endpoint, setEndpoint] = useState('avgConsMake');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOriginalData, setShowOriginalData] = useState(false);

  useEffect(() => {
    fetchData(endpoint);
  }, [endpoint]);

  const formatData = (data) => {
    return data.map(item => {
      const formattedItem = { ...item };
      for (const key in item) {
        if (typeof item[key] === 'number') {
          formattedItem[key] = parseFloat(item[key].toFixed(2));
        } else if (item[key] === undefined || item[key] === null) {
          formattedItem[key] = 0; // Or handle this case appropriately
        }
      }
      return formattedItem;
    });
  };

  const fetchData = async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/${endpoint}`);
      console.log("Fetched data:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setData(formatData(response.data));
      } else {
        throw new Error("Unexpected data format");
      }
    } catch (err) {
      setError(`Error fetching ${endpoint} data: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOriginalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/fuel_consumption_ratings');
      console.log("Fetched original data:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
        setShowOriginalData(true);
      } else {
        throw new Error("Unexpected data format");
      }
    } catch (err) {
      setError(`Error fetching original data: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <p>No data available</p>;
    }

    const chartType = {
      'avgConsMake': 'BarChart',
      'topEfficient': 'BarChart',
      'fuelTypeDist': 'PieChart',
      'co2ByClass': 'BarChart',
      'bestSmog': 'BarChart',
      'consByTrans': 'BarChart',
      'co2RatingPct': 'year',
      'topLowCo2': 'BarChart'
    }[endpoint] || 'LineChart';

    const dataKeyMap = {
      'avgConsMake': { xKey: 'MAKE', yKey: 'AVG_CONS' },
      'topEfficient': { xKey: 'MODEL', yKey: 'COMB_CONS' },
      'fuelTypeDist': { xKey: 'FUEL_TYPE', yKey: 'COUNT_FT' },
      'co2ByClass': { xKey: 'VEH_CLASS', yKey: 'AVG_CO2' },
      'bestSmog': { xKey: 'MODEL', yKey: 'SMOG_RATING' },
      'consByTrans': { xKey: 'TRANS', yKey: 'AVG_CONS' },
      'co2RatingPct': { xKey: 'CO2_RATING', yKey: 'PERCENTAGE' },
      'topLowCo2': { xKey: 'MAKE', yKey: 'AVG_CO2' }
    };

    const { xKey, yKey } = dataKeyMap[endpoint] || { xKey: 'x', yKey: 'y' };

    const years = [2022, 2023, 2024];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#19FFDD', '#FFA319'];

    switch (chartType) {
      case'year':
      return (
        <div>
          {years.map(year => {
            const yearData = data.filter(item => item.MODEL_YEAR === year);
            return (
              <div key={year} style={{ marginBottom: '20px' }}>
                <h3>Model Year: {year}</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={yearData}
                      dataKey="PERCENTAGE"
                      nameKey="CO2_RATING"
                      outerRadius={150}
                      fill="#8884d8"
                      label
                    >
                    <LabelList
                      dataKey="CO2_RATING"
                      position="inside"
                      style={{ fill: '#fff', fontSize: '14px' }}
                    />
                      {yearData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      );
      case 'PieChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data} 
                dataKey={yKey} 
                nameKey={xKey} 
                outerRadius={150} 
                fill="#8884d8" 
                label 
                labelLine={false}
              >
              <LabelList
                      dataKey={xKey}
                      position="inside"
                      style={{ fill: '#fff', fontSize: '14px' }}
                    />
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toFixed(2)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'BarChart':
        const barSize = Math.max(40, 200 / data.length);
        const chartHeight = Math.max(500, data.length * 40);
        const calculateLabelWidth = (label) => {
          const averageCharWidth = 8; // Adjust based on font-size, this is an estimate
          return label ? label.length * averageCharWidth : 0;
        };
        
        // Calculate maximum width required by any label
// Ensure data is an array and has elements
const maxLabelWidth = Array.isArray(data) && data.length > 0 
  ? Math.max(
      ...data.map(item => {
        if (!xKey) {
          console.warn('xKey is undefined or null:', xKey);
          return 0;
        }

        const label = item[xKey];
        if (label === undefined) {
          console.warn('item[xKey] is undefined for xKey:', xKey);
          return 0;
        }

        return calculateLabelWidth(label);
      })
    )
  : 0; // Default to 0 if data is not valid

console.log('maxLabelWidth:', maxLabelWidth);    
        
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart layout="vertical" data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid stroke="#eee" />
              <XAxis type="number" tickFormatter={(value) => value.toFixed(2)} />
              <YAxis type="category" dataKey={xKey} width={maxLabelWidth} />
              <Tooltip formatter={(value) => value.toFixed(2)} />
              <Legend />
              <Bar dataKey={yKey} fill="#8884d8" barSize={barSize} minPointLength={10}>
                <LabelList dataKey={yKey} position="right" formatter={(value) => value.toFixed(2)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey={xKey} />
              <YAxis tickFormatter={(value) => value.toFixed(2)} />
              <Tooltip formatter={(value) => value.toFixed(2)} />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div>
      <AppBar position="static" style={{ marginBottom: '20px' }}>
        <Toolbar>
          <Typography variant="h4" style={{ flexGrow: 1, fontWeight: 'bold' }}>
            Vehicle Data Dashboard
          </Typography>
          {['avgConsMake', 'topEfficient', 'fuelTypeDist', 'co2ByClass', 'bestSmog', 'consByTrans', 'co2RatingPct', 'topLowCo2'].map((key, index) => (
            <Button
              key={index}
              variant="contained"
              color="primary"
              style={{ marginRight: '10px', borderRadius: '20px', textTransform: 'none' }}
              onClick={() => {
                setEndpoint(key);
                setShowOriginalData(false);
              }}
            >
              {key.split(/(?=[A-Z])/).join(' ')}
            </Button>
          ))}
          <Button
            variant="contained"
            color="secondary"
            style={{ marginRight: '10px', borderRadius: '20px', textTransform: 'none' }}
            onClick={fetchOriginalData}
          >
            Show Original Data
          </Button>
        </Toolbar>
      </AppBar>
      <Container style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {showOriginalData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto' }}>
            <h2>Original Data Table</h2>
            <TableContainer component={Paper} style={{ maxWidth: '1200px', overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model Year</TableCell>
                    <TableCell>Make</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Vehicle Class</TableCell>
                    <TableCell>Engine Size</TableCell>
                    <TableCell>Cylinders</TableCell>
                    <TableCell>Transmission</TableCell>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>City Consumption</TableCell>
                    <TableCell>Highway Consumption</TableCell>
                    <TableCell>Combined Consumption</TableCell>
                    <TableCell>Combined MPG</TableCell>
                    <TableCell>CO2 Emissions</TableCell>
                    <TableCell>CO2 Rating</TableCell>
                    <TableCell>Smog Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                    <TableCell>{row.MODEL_YEAR}</TableCell>
                    <TableCell>{row.MAKE}</TableCell>
                    <TableCell>{row.MODEL}</TableCell>
                    <TableCell>{row.VEHICLE_CLASS}</TableCell>
                    <TableCell>{row.ENGINE_SIZE}</TableCell>
                    <TableCell>{row.CYLINDERS}</TableCell>
                    <TableCell>{row.TRANSMISSION}</TableCell>
                    <TableCell>{row.FUEL_TYPE}</TableCell>
                    <TableCell>{row.CITY_CONSUMPTION}</TableCell>
                    <TableCell>{row.HIGHWAY_CONSUMPTION}</TableCell>
                    <TableCell>{row.COMBINED_CONSUMPTION}</TableCell>
                    <TableCell>{row.COMBINED_MPG}</TableCell>
                    <TableCell>{row.CO2_EMISSIONS}</TableCell>
                    <TableCell>{row.CO2_RATING}</TableCell>
                    <TableCell>{row.SMOG_RATING}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ) : (
          renderChart()
        )}
      </Container>
    </div>
  );
};

export default App;
