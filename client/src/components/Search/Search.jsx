import React, { useState, useEffect, useContext } from "react";
import UserContext from "../../context/UserContext";
import { TextField, Container, Grid, Box, Card } from "@material-ui/core/";
import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";
import { makeStyles } from "@material-ui/core/styles";
import LineChart from "../Template/LineChart";
import BarChart from "./BarChart";
import Copyright from "../Template/Copyright";
import styles from "./Search.module.css";
import Axios from "axios";
import InfoCard from "./InfoCard";
import PriceCard from "./PriceCard";
import PurchaseCard from "./PurchaseCard";
import PurchaseModal from "./PurchaseModal";
import config from "../../config/Config";


const filter = createFilterOptions();

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    marginBottom: "40px",
  },
}));

const LineChartCard = ({ pastDataPeriod, stockInfo, duration }) => {
  return (
    <Grid
      item
      xs={12}
      sm={7}
      component={Card}
      className={styles.card}
      style={{ minHeight: "350px" }}
    >
      <LineChart
        pastDataPeriod={pastDataPeriod}
        stockInfo={stockInfo}
        duration={duration}
      />
    </Grid>
  );
};

const BarChartCard = ({ sixMonthAverages, stockInfo }) => {
  return (
    <Grid item xs={12} sm component={Card} className={styles.card}>
      <BarChart sixMonthAverages={sixMonthAverages} stockInfo={stockInfo} />
    </Grid>
  );
};

const StockCard = ({ setPurchasedStocks, purchasedStocks, currentStock }) => {
  const { userData } = useContext(UserContext);
  const [selected, setSelected] = useState(false);
  const [stockInfo, setStockInfo] = useState(undefined);
  const [sixMonthAverages, setSixMonthAverages] = useState(undefined);
  const [pastDay, setPastDay] = useState(undefined);
  const [today, setToday] = useState(undefined);
  const [pastMonth, setPastMonth] = useState(undefined);
  const [pastTwoYears, setPastTwoYears] = useState(undefined);
  const [currentTicker, setCurrentTicker] = useState(null);

  useEffect(() => {
    console.log("currentStock:", currentStock);
    if (!currentStock) return;

    const getInfo = async () => {
      console.log("getInfo called");
      const url = config.base_url + `/api/data/prices/${currentStock.ticker}`;
      const response = await Axios.get(url);
      if (response.data.status === "success") {
        setStockInfo(response.data.data);
      }
    };

    const getData = async () => {
      console.log("getData called");
      const url =
        config.base_url + `/api/data/prices/${currentStock.ticker}/full`;
      const response = await Axios.get(url);
      if (response.data.status === "success") {
        setSixMonthAverages(response.data.sixMonthAverages);
        setPastDay(response.data.pastDay);
        setToday(response.data.today);
        setPastMonth(response.data.pastMonth);
        setPastTwoYears(response.data.pastTwoYears);
      }
    };

    getInfo();
    getData();
  }, [currentStock]);

  console.log("stockInfo:", stockInfo);
  console.log("sixMonthAverages:", sixMonthAverages);
  console.log("pastDay:", pastDay);
  console.log("today:", today);
  console.log("pastMonth:", pastMonth);
  console.log("pastTwoYears:", pastTwoYears);

  return (
    <div className={styles.root}>
      {stockInfo && pastDay && (
        <InfoCard stockInfo={stockInfo} price={pastDay.adjClose} />
      )}
      {stockInfo && sixMonthAverages && pastDay && pastMonth && pastTwoYears && (
        <div>
          <Grid container spacing={3}>
            <LineChartCard
              pastDataPeriod={pastTwoYears}
              stockInfo={stockInfo}
              duration={"2 years"}
            />
            <BarChartCard
              sixMonthAverages={sixMonthAverages}
              stockInfo={stockInfo}
            />
          </Grid>
          <PriceCard pastDay={pastDay} />
          <Grid container spacing={3}>
            <PurchaseCard
              setSelected={setSelected}
              balance={userData.user.balance}
            />
            <LineChartCard
              pastDataPeriod={pastMonth}
              stockInfo={stockInfo}
              duration={"month"}
            />
          </Grid>
          <Box pt={4}>
            <Copyright />
          </Box>
          {selected && (
            <PurchaseModal
              stockInfo={stockInfo}
              today={today}
              pastDay={pastDay}
              setSelected={setSelected}
              setPurchasedStocks={setPurchasedStocks}
              purchasedStocks={purchasedStocks}
            />
          )}
        </div>
      )}
    </div>
  );
};



const Search = ({ setPurchasedStocks, purchasedStocks }) => {
  const classes = useStyles();
  const { userData } = useContext(UserContext);
  const [value, setValue] = useState(null);
  const [currentStock, setCurrentStock] = useState(null);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const onInputChange = (event, newValue) => {
    setInputValue(newValue);
  };

  useEffect(() => {
    if (inputValue !== '') {
      fetchOptions(inputValue);
    }
  }, [inputValue]);

  const onSearchChange = (event, newValue) => {
    console.log("onSearchChange newValue:", newValue); // Add this line

    setValue(newValue);
    if (newValue) {
      console.log("new value:", newValue);
      setCurrentStock(newValue);
    } else {
      setCurrentStock(null);
    }
  };

  const fetchOptions = async (value) => {

    const headers = {
      "x-auth-token": userData.token,
    };
    const url = config.base_url + `/api/stock/search/${userData.user.id}/${value || ''}`;
    const response = await Axios.get(url, { headers });
    console.log("API response:", response);
    if (response.data.status === 'success') {
      setOptions(response.data.data);
    }
  };




  return (
    <Container className={classes.addMargin}>

      <Autocomplete
        value={value}
        onChange={onSearchChange}
        onInputChange={onInputChange}
        filterOptions={(options, params) => {
          let filtered = filter(options, params);
          if (currentStock) {
            filtered = filtered.slice(0, 4);
          }
          return filtered;
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        id="stock-search-bar"
        options={options}
        getOptionLabel={(option) => {
          return option.name || "";
        }}
        getOptionSelected={(option, value) => option.ticker === value.ticker}
        renderOption={(option) => option.name}
        style={{
          maxWidth: "700px",
          margin: "30px auto",
          marginBottom: "60px",
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search for a stock"
            variant="outlined"
          />
        )}
      />



      {currentStock && (
        <StockCard
          setPurchasedStocks={setPurchasedStocks}
          purchasedStocks={purchasedStocks}
          currentStock={currentStock}
        />
      )}
      <br />
      <br />
      <br />
    </Container>
  );
};



export default Search;
