import * as Firebase from 'firebase';
import { View, StyleSheet, ScrollView, StatusBar, SafeAreaView, ImageBackground } from 'react-native';
import { Button, Title, Card, Text, Divider } from 'react-native-paper';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';

import { logout as logoutAction, saveProfileToReducer, setLogs } from '../store/authSlice';
import { setPlan } from '../store/exerciseSlice';
import LoadingScreen from './LoadingScreen';
import Carousel, { Pagination } from 'react-native-snap-carousel';
const REST_DAY_IMAGE = require('../../assets/image/rest-day.jpg');
const ARM_WORKOUT_IMAGE = require('../../assets/image/exercise-survey-bg.jpg');

import { Pedometer } from 'expo-sensors';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryLine } from "victory-native";
import { computeNutritionValues } from "../hooks/diet/Nutrition";

export default function HomeScreen({ navigation }) {
	let user = useSelector(state => state.main.auth.user) || {};
	let currentProfile = useSelector(state => state.main.auth.profile) || {};
	let currentPlan = useSelector(state => state.main.exercise.plan);
	let logs = useSelector(state => state.main.auth.logs) || {};
	var plan = {};
	const [isFetched, setIsFetched] = useState(false);
	const [profile, setProfile] = useState(null);
	const [workoutOfTheDay, setWorkoutOfTheDay] = useState(null);
	const [insightCarouselActiveIndex, setInsightCarouselActiveIndex] = useState(0);
	const [caloriesConsumedThisWeek, setCaloriesBurntThisWeek] = useState(0);
	const today = moment();
	const dispatch = useDispatch();

	const logout = () => {
		Firebase.auth().signOut()
			.then(() => {
			// Sign-out successful.
				dispatch(logoutAction());
		  	})
		  	.catch(() => {
				// An error happened.
			});
	}

	// Render function for recipe item recommendations.
	function InsightsSummary(props) {
		return (				
		<View style={{ flex: 1, flexDirection: "column", alignItems: 'center', justifyContent: 'center'}}>
			<Title style={{ fontSize: 26, marginTop: 15 }}>This Week</Title>
			<View style={{ flex: 1, flexDirection: "row" }}>
				<View style={{ width: 80, marginLeft: 5, justifyContent: 'center' }}>
					<View style={{ justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{ fontSize: 32 }}>{caloriesConsumedThisWeek}</Text>
					</View>
					<View style={{ justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{ fontSize: 10, textAlign: 'center' }}>average calories intake</Text>
					</View>
				</View>
				<View style={{ width: 110, marginHorizontal: 5, justifyContent: 'center', marginBottom: 10 }}>
					<View style={{ justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{ fontSize: 72, fontWeight: '600' }}>3</Text>
					</View>
					<View style={{ justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{ fontSize: 12, textAlign: 'center'}}>workouts completed</Text>
					</View>
				</View>
				<View style={{ width: 80, marginRight: 5, justifyContent: 'center' }}>
					<View style={{ justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{ fontSize: 32 }}>{caloriesConsumedThisWeek}</Text>
					</View>
					<View style={{ justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{ fontSize: 10, textAlign: 'center' }}>average calories consumption</Text>
					</View>
				</View>
			</View>
		</View>)
	}

	function InsightsDiet(props) {
		const data = [];
		const nutritionValues = computeNutritionValues(profile)
		for (let d=0; d<7; d++) {
			let l = moment().add(-7+d, 'days').format('YYYYMMDD')
			console.log(l)
			if (!!logs[l]) {
				let totalCalories = 0;
				for (let diet in logs[l]['diet']) {
					let result = logs[l]['diet'][diet].reduce(function (acc, obj) { return acc + parseInt(obj.calorieAmount); }, 0); // 7
					totalCalories += result
				}
				data.push({ day: moment(l).format('DD/MM'), calories: totalCalories })
			} else data.push({ day: moment(l).format('DD/MM'), calories: 0 })
		}
		console.log(data);
		return (		
			<View style={{ flex: 1, flexDirection: "column", alignItems: 'center', justifyContent: 'center'}}>
			<Title style={{ fontSize: 22, marginTop: 15 }}>Weekly Diet</Title>
			<VictoryChart width={310} height={200} theme={VictoryTheme.material} padding={{ left: 50, right: 50, top: 10, bottom: 40}}>
				<VictoryLine y={() => nutritionValues.dailyRecommendedCalories} />
				<VictoryBar data={data} x="day" y="calories" />
			</VictoryChart>
		</View>)
	}

	function _renderInsights( { item, index } ){

		console.log('rendering insights:', item)
		return (
			<View style={{
				borderRadius: 8,
				height: 230,
				width: null,
				backgroundColor: 'white',
			}}>
				{item == 'summary' && <InsightsSummary />}
				{item == 'diet' && <InsightsDiet />}
			</View>
		)
	}

	// This functions fires every time when the user clicks into home screen
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			// The screen is focused
			// Call any action
		});
	
		// Return the function to unsubscribe from the event so it gets removed on unmount
		return unsubscribe;
	  }, [navigation]);

	useEffect(() => {
		// Listen to profile update and update workout of the day.
		console.log('plan update triggered.')
		if (!!currentPlan) {
			for (var prop in currentPlan) {
				if (moment().day(prop).day() == today.day()) {
					setWorkoutOfTheDay(currentPlan[prop]);
					// console.log(currentPlan[prop]);
				}
			}
		}
	}, [currentPlan]);

	// Listen to log update and update the logs for diet and exercise
	useEffect(() => {
		if (!!logs) {
			let totalAmountOfCalories = 0, daysLogged = 0;
			for (var l in logs) {
				if (l >= moment().add(-7, 'days').format('YYYYMMDD') && l <= today.format('YYYYMMDD')) {
					daysLogged++;
					for (var d in logs[l].diet) {
						console.log(d, logs[l]['diet'][d]);
						let result = logs[l]['diet'][d].reduce(function (acc, obj) { return acc + parseInt(obj.calorieAmount); }, 0); // 7
						totalAmountOfCalories += result;
					}
				}
			};
			setCaloriesBurntThisWeek(totalAmountOfCalories/daysLogged);
		}
	}, [logs])

	useEffect(() => {
		if (!profile && isFetched) {
			navigation.navigate('Entrance Survey');
		};
	}, [isFetched]);

	useEffect(() => {
        (() => {
			setIsFetched(false);
			const userDatabaseRef = Firebase.database().ref(`/users/${user.uid}`);
			userDatabaseRef.once('value', snapshot => { 
				let value = snapshot.val();
				if (!!value) {
				  dispatch(saveProfileToReducer({ profile: value.profile }));
				  setProfile(value.profile);
				  dispatch(setPlan({ plan: value.exercisePlan }));
				  dispatch(setLogs({ logs: value.logs }));
  
				  plan = value.exercisePlan;
				  for (var prop in plan) {
					  if (moment().day(prop).day() == today.day()) {
						  setWorkoutOfTheDay(plan[prop]);
					  }
				  }
				}
				setIsFetched(true);
			});
        })();
	}, []);

	if (!isFetched) {
		return <LoadingScreen />
	} else {
		return (
			<SafeAreaView>
			<ScrollView contentContainerStyle={{ padding: 10 }}>
				<StatusBar barStyle="dark-content" style="auto" />
				<View style={{ flex: 1 }}>
					<Title style={{ alignSelf: 'center', color: 'white' }}>See how far you have gone!</Title>
					<View style={{  
						position: 'absolute',
						alignSelf: 'center',
						zIndex: -99,
						top: -250,
						width: 600, 
						height: 600,
						overflow: 'hidden',
						borderRadius: 600 / 2, 
						backgroundColor: "#1E90FF"}}>
					</View>

					<View style={{ marginVertical: 15, alignItems: 'center', justifyContent: 'center' }}>
						<Carousel
							layout={"default"}
							layoutCardOffset={3}
							activeSlideOffset={5}
							data={['summary', 'diet']}
							containerCustomStyle={{overflow: "visible"}}
							sliderWidth={350}
							itemWidth={310}
							renderItem={_renderInsights}
							onSnapToItem = { index => setInsightCarouselActiveIndex(index) }
						/>
						<Pagination
							dotsLength={3}
							activeDotIndex={insightCarouselActiveIndex}
							containerStyle={{ paddingVertical: 8 }}
							dotColor={'white'}
							dotStyle={styles.paginationDot}
							inactiveDotColor={'grey'}
							inactiveDotOpacity={0.4}
							inactiveDotScale={0.6}
						/>
					</View>
					
					<View style={{ marginVertical: 20 }}>
						<Card>
							<View style={{ flexDirection: 'row', marginTop: 5 }}>
								<View>
									<Title style={{ marginLeft: 15 }}>Food</Title>
								</View>
								<View style={{ flex: 1, alignItems: 'flex-end' }}>
									<Button 
										icon="plus" 
										style={{ alignSelf: 'flex-end' }}
										onPress={() => navigation.navigate('Log Diet')}
									>Log food</Button>
								</View>
							</View>
							<Divider />
						<Card.Content style={{ marginTop: 5 }}>
							<View style={{
								marginTop: 10,
								borderWidth: 2, 
								padding: 10, 
								borderStyle: 'dashed', 
								borderColor: '#1E90FF', 
								minHeight: 100,  }}>
								{!!logs[today.format('YYYYMMDD')] ?
								<View style={{ width: '100%' }}>
									<Title>Your logged meals today: </Title>
									{!!logs[today.format('YYYYMMDD')]['diet']['breakfast'] &&
									<View style={{ width: '100%', marginVertical: 5 }}>
										<Divider />
										<Title>Breakfast</Title>
										{logs[today.format('YYYYMMDD')]['diet']['breakfast'].map((item, index) =>
											<View key={index} style={{ width: '100%', flexDirection: 'row' }}>
												<View>
													<Text style={{ alignSelf: 'flex-start' }}>{item.itemName}</Text>
												</View>
												<View style={{ flex: 1, alignItems: 'flex-end' }}>
													<Text style={{ alignSelf: 'flex-end' }}>{`${item.calorieAmount} kcal`}</Text>
												</View>
											</View>)}
									</View>}
									{!!logs[today.format('YYYYMMDD')]['diet']['lunch'] &&
									<View style={{ width: '100%', marginVertical: 5 }}>
										<Divider />
										<Title>Lunch</Title>
										{logs[today.format('YYYYMMDD')]['diet']['lunch'].map((item, index) =>
											<View key={index} style={{ width: '100%', flexDirection: 'row' }}>
												<View>
													<Text style={{ alignSelf: 'flex-start' }}>{item.itemName}</Text>
												</View>
												<View style={{ flex: 1, alignItems: 'flex-end' }}>
													<Text style={{ alignSelf: 'flex-end' }}>{`${item.calorieAmount} kcal`}</Text>
												</View>
											</View>)}
									</View>}
									{!!logs[today.format('YYYYMMDD')]['diet']['snack'] &&
									<View style={{ width: '100%', marginVertical: 5 }}>
										<Divider />
										<Title>Snack</Title>
										{logs[today.format('YYYYMMDD')]['diet']['snack'].map((item, index) =>
											<View key={index} style={{ width: '100%', flexDirection: 'row' }}>
												<View>
													<Text style={{ alignSelf: 'flex-start' }}>{item.itemName}</Text>
												</View>
												<View style={{ flex: 1, alignItems: 'flex-end' }}>
													<Text style={{ alignSelf: 'flex-end' }}>{`${item.calorieAmount} kcal`}</Text>
												</View>
											</View>)}
									</View>}
									{!!logs[today.format('YYYYMMDD')]['diet']['dinner'] &&
									<View style={{ width: '100%' }}>
										<Divider />
										<Title>Dinner</Title>
										{logs[today.format('YYYYMMDD')]['diet']['dinner'].map((item, index) =>
											<View key={index} style={{ width: '100%', flexDirection: 'row' }}>
												<View>
													<Text style={{ alignSelf: 'flex-start' }}>{item.itemName}</Text>
												</View>
												<View style={{ flex: 1, alignItems: 'flex-end' }}>
													<Text style={{ alignSelf: 'flex-end' }}>{`${item.calorieAmount} kcal`}</Text>
												</View>
											</View>)}
									</View>}
									{/* <Text>{JSON.stringify(logs[today.format('YYYYMMDD')]['diet'])}</Text> */}
								</View>
 								:
								<Text>You have not logged your diet yet. Logged food will be shown here.</Text>}
							</View>
							<View style={{ marginTop: 5, flexDirection: 'row', justifyContent: 'center' }}>
								<Button onPress={() => navigation.navigate('Diet')}>Explore Recommendations</Button>
							</View>
						</Card.Content>
						</Card>
					</View>

					<View style={{ marginBottom: 20 }}>
					<Card>
						<View style={{ flexDirection: 'row', marginTop: 5 }}>
							<View>
								<Title style={{ marginLeft: 15 }}>Workout</Title>
							</View>
							<View style={{ flex: 1, alignItems: 'flex-end' }}>
								<Button icon="plus" style={{ alignSelf: 'flex-end' }}>Log workout</Button>
							</View>
						</View>
						<Divider />
						{!!workoutOfTheDay && 
							<Card.Content style={{ marginTop: 5 }}>
							{workoutOfTheDay.type == 'rest' ? 
								<View style={{ height: 170, width: '100%', borderRadius: 20 }}>
									<ImageBackground source={REST_DAY_IMAGE} style={styles.bakcgroundImage}>
										<View style={styles.textOverImageWrapper}>
											<Title style={styles.titleOverImage}>REST DAY!</Title>
											<Text style={{ fontWeight: "600", color: "white" }}>Try to relax and let your body recover!</Text>
										</View>
									</ImageBackground>
								</View>
							: <View style={{ height: 170, width: '100%', borderRadius: 20, }}>
								<ImageBackground source={ARM_WORKOUT_IMAGE} style={styles.bakcgroundImage}>
									<View style={styles.textOverImageWrapper}>
										<Title style={styles.titleOverImage}>{workoutOfTheDay.name}</Title>
										<Text style={{ fontWeight: "600", color: "white" }}>{workoutOfTheDay.description || `This workout is intended for building your arm strength.`}</Text>
									</View>
								</ImageBackground>
							</View>}
							{!!workoutOfTheDay &&
							<View style={{ marginVertical: 5, flexDirection: 'row', justifyContent: 'center' }}>
								{workoutOfTheDay.type != 'rest' && 
									<Button onPress={() => navigation.navigate('Exercise')}>Do Workout</Button>}
							</View>}
							</Card.Content>}
						{!workoutOfTheDay && 
							<Card.Content>
								<View style={{ height: 170, width: '100%', borderRadius: 20 }}>
									<Text>Complete your survey to access your workout recommendations.</Text>
								</View>
							</Card.Content>}
						</Card>
					</View>

					<Button style={styles.btnStyle} mode='contained' onPress={() => navigation.navigate('Entrance Survey')}>
						Manage My Profile
					</Button>
					<Button style={styles.btnStyle} mode='contained' onPress={() => logout()}>
						Log out
					</Button>
				</View>
			</ScrollView>
			</SafeAreaView>
		);
	}
}

const styles = StyleSheet.create({
	container: {
	  flex: 1,
	  flexDirection: 'column',
	  justifyContent: 'center',
	  alignItems: 'center',
	  padding: 10,
	  // backgroundColor: 'white'
	},
	bakcgroundImage: {
		flex: 1,
		resizeMode: "cover",
		justifyContent: "center",
		opacity: 0.8
	},
	textOverImageWrapper: {
		justifyContent: 'flex-end',
		position: "absolute", // child
		bottom: 0, // position where you want
		left: 0,
		marginLeft: 5,
		marginBottom: 10
	},
	titleOverImage: {
		fontWeight: "700", 
		color: "white", 
		fontSize: 32,
		backgroundColor: '#1E90FF',
		justifyContent: 'center',
		paddingLeft: 3,
		paddingTop: 3,
		alignSelf: 'flex-start'
	},
	btnStyle:{
	  margin: 10,
	  alignSelf: "center"
	},
	textInputStyle:{
	  margin: 10
	},
	errorTextStyle:{
	  fontSize: 20,
	  alignSelf: 'center',
	  color:'red'
	}
  })