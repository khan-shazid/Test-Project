import React, { Component } from "react";
import {
  View,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ToastAndroid,
  TextInput,
  Modal
} from "react-native";
import Spinner from "react-native-loading-spinner-overlay";
import Menu, { MenuItem, MenuDivider } from "react-native-material-menu";

import {
  PRODUCTS_API,
  PRODUCTS_FILTER_CATEGORY,
  IMAGE_PREFIX,
  IMAGE_SUFFIX,
  WIDTH,
  HEIGHT
} from "../../../configuration";
import FlatListBody from "../components/FlatListBody";

var data = [];
export default class ProductListContainer extends Component {
  // _fetchProducts = async () => {
  // 	await this.props.fetchProducts();
  // };
  constructor(props) {
    super(props);
    const { params } = this.props.navigation.state;
    this.state = {
      token: params.token,
      cart: [],
      data: [],
      visible: false,
      visible2: false,
      limit: 10,
      offset: 0,
      total: 1,
      toastFlag: true,
      textFlag: false,
      text: "",
      modalVisible: false,
      totalCost: 0,
      toggleDiscount: false,
      discountAmount: 0
    };
  }

  _menu = null;

  setMenuRef = ref => {
    this._menu = ref;
  };
  componentDidMount() {
    this._setData();
  }

  _setData = async () => {
    this.setState({
      visible: true
    });
    let offset = this.state.offset + 1;

    let url =
      PRODUCTS_API +
      "?page[limit]=" +
      this.state.limit +
      "&page[offset]=" +
      offset;

    if (offset > this.state.total && this.state.toastFlag) {
      ToastAndroid.showWithGravity(
        "No More Items",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      this.setState({
        toastFlag: false,
        visible: false
      });
    } else {
      await fetch(url, {
        method: "get",
        headers: {
          Accept: "application/json, text/plain, */*",
          Authorization: this.state.token
        }
      })
        .then(response => response.json())
        .then(responseData => {
          let parsedData = [];
          responseData.data.map(item => {
            parsedData.push({
              id: item.id,
              type: item.type,
              name: item.name,
              price: item.price[0].amount,
              amount: 0,
              image: item.relationships.files.data[0].id
            });
          });
          // console.warn(JSON.stringify(parsedData));
          this.setState({
            data: [...this.state.data, ...parsedData],
            visible: false,
            total: responseData.meta.page.total,
            offset: responseData.meta.page.offset
          });
          // console.warn(responseData.meta.page.total)
        })
        .catch(error => {
          this.setState({
            visible: false
          });
          Alert.alert("Caution!", "Please check your internet connection!");
        })
        .done();
    }
  };

  logout = () => {
    const { navigate } = this.props.navigation;
    navigate("Login");
  };

  refresh = () => {
    this.setState({
      offset: 0,
      total: 1,
      textFlag: false,
      toastFlag: true
    });
    this._setData();
  };

  addToCart = index => {
    let flag = 0;
    let data = this.state.data;
    data[index].amount++;
    let cart = this.state.cart;
    cart.map(item => {
      if (item.id == data[index].id) {
        item.amount++;
        flag = 1;
      }
    });
    if (!flag) {
      let obj = {
        id: data[index].id,
        name: data[index].name,
        price: data[index].price,
        amount: 1
      };
      cart.push(obj);
      // console.warn(obj.name);
    }
    // console.warn(flag);

    // cart.push(this.state.data[index]);
    this.setState({
      cart: cart,
      data: data
    });
    ToastAndroid.showWithGravity(
      "Added To Cart",
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM
    );
    // console.warn(cart)
  };

  deleteFromCart = index => {
    let flag = 0;
    let track = 0;
    let data = this.state.data;
    if (data[index].amount == 0) {
      return 0;
    }
    data[index].amount--;
    let cart = this.state.cart;
    cart.map((item, i) => {
      if (item.id == data[index].id) {
        // console.warn(i);
        track = i;
        item.amount--;
        flag = 1;
      }
    });
    if (flag != 0) {
      cart.splice(track, 1);
    }
    this.setState({
      cart: cart,
      data: data
    });
    ToastAndroid.showWithGravity(
      "Removed From Cart",
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM
    );
  };
  toggleCart = () => {
    let totalCost = 0;
    this.state.cart.map(item => {
      totalCost += parseInt(item.price) * parseInt(item.amount);
    });
    this.setState({
      totalCost: totalCost,
      modalVisible: !this.state.modalVisible,
      discountAmount: totalCost * 0.1
    });
  };

  toggleDiscount = () => {
    let amount = this.state.totalCost;
    if (!this.state.toggleDiscount == true) {
      this.setState({
        totalCost: this.state.totalCost - this.state.discountAmount,
        toggleDiscount: !this.state.toggleDiscount
      });
    } else {
      this.setState({
        totalCost: this.state.totalCost + this.state.discountAmount,
        toggleDiscount: !this.state.toggleDiscount
      });
    }
  };

  setModalData = () => {
    let data = [];
    this.state.cart.map(item => {
      data.push(
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between"
          }}
          key={item.id}
        >
          <Text style={{ padding: 10 }}>{item.name.substring(0, 10)}</Text>
          <Text style={{ padding: 10 }}>{item.amount}</Text>
          <Text style={{ padding: 10 }}>{item.price}</Text>
        </View>
      );
    });
    return data;
  };

  calculateCost = () => {
    let totalCost = this.state.totalCost;
    this.state.cart.map(item => {
      totalCost += parseInt(item.price) * parseInt(item.amount);
    });
    this.setState({
      totalCost: totalCost
    });
    return <Text>Total Cost : {this.state.totalCost}</Text>;
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.2)" }}>
        <View style={s.header}>
          <Text style={{ padding: 5 }} onPress={this.refresh}>
            Refresh
          </Text>

          <Text style={{ padding: 5 }} onPress={this.logout}>
            Logout
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginLeft: 10,
            marginRight: 10,
            marginTop: 5
          }}
        >
          {this.state.textFlag ? (
            <Text style={{ textAlign: "center", color: "green" }}>
              Filtering on CategoryID - {this.state.text}
            </Text>
          ) : (
            <Text style={{ textAlign: "center", color: "green" }}>
              Loaded {this.state.offset} pages out of {this.state.total} pages
            </Text>
          )}
          <TouchableOpacity onPress={() => this.toggleCart()}>
            <Image
              style={{ height: 20, width: 20 }}
              source={require("../assets/cart.png")}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={s.container}
          onScroll={e => {
            (height = e.nativeEvent.contentSize.height),
              (offset = e.nativeEvent.contentOffset.y);
            if (HEIGHT + offset >= height) {
              this._setData();
            }
          }}
        >
          <Spinner
            visible={this.state.visible}
            textContent={"Loading..."}
            textStyle={s.spinner}
            animation={"fade"}
            size={"small"}
            cancelable={true}
            color={"#3B5998"}
          />
          <FlatList
            contentContainerStyle={{ margin: 5 }}
            data={this.state.data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={{ margin: 5, backgroundColor: "white" }}>
                <FlatListBody item={item} />
                <View style={s.flatListFooter}>
                  <Text style={s.flatListFooterText}>{item.name}</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between"
                  }}
                >
                  <TouchableOpacity
                    style={s.flatListFooter2}
                    onPress={() => this.deleteFromCart(index)}
                  >
                    <Text style={{ fontSize: 20, padding: 5 }}>-</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, padding: 5 }}>
                    {item.amount}
                  </Text>
                  <TouchableOpacity
                    style={s.flatListFooter2}
                    onPress={() => this.addToCart(index)}
                  >
                    <Text style={{ fontSize: 20, padding: 5 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </ScrollView>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            Alert.alert("Modal has been closed.");
          }}
        >
          <ScrollView style={{ marginTop: 22 }}>
            {this.setModalData()}
            <Text>Total Cost : {this.state.totalCost}</Text>
            <TouchableOpacity onPress={() => this.toggleDiscount()}>
              {this.state.toggleDiscount ? (
                <Text style={{ color: "red" }}>Disable Discount(10%)</Text>
              ) : (
                <Text style={{ color: "green" }}>Enable Discount(10%)</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.toggleCart()}>
              <Text style={{ color: "red" }}>close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: {
    flex: 0.9
    // backgroundColor:'rgba(0,0,0,.2)'
  },
  header: {
    // height:50,
    flex: 0.1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3B5998"
    // position:'absolute',
    // bottom:0
  },
  spinner: {
    color: "#3B5998",
    fontSize: 12,
    paddingTop: 30
  },
  flatListFooter: {
    // borderTopWidth: 1,
    backgroundColor: "rgba(0,0,0,.8)",
    borderColor: "rgba(0,0,0,.2)"
  },
  flatListFooter2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,.2)"
  },
  flatListFooterText: {
    padding: 5,
    textAlign: "center",
    color: "white"
  }
});
